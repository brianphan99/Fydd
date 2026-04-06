import feedparser
import requests
import time
from concurrent.futures import ThreadPoolExecutor
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Feed, SavedArticle, ReadArticle, UserSettings
from .serializers import FeedSerializer, SavedArticleSerializer, ReadArticleSerializer, UserSettingsSerializer

from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup

class FeedDiscoveryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        target_url = request.data.get('url', '').strip()
        if not target_url:
            return Response({'error': 'URL required'}, status=status.HTTP_400_BAD_REQUEST)

        # Add protocol if missing
        if not target_url.startswith(('http://', 'https://')):
            target_url = 'https://' + target_url

        # OPTIMIZATION: Check if we already follow this exact URL
        existing = Feed.objects.filter(user=request.user, url=target_url).first()
        if existing:
            return self.respond_with_feeds(request.user, [{
                'title': existing.title,
                'url': existing.url
            }])

        try:
            # More standard browser headers to avoid 429/403
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }
            
            try:
                response = requests.get(target_url, headers=headers, timeout=15, allow_redirects=True)
            except (requests.exceptions.SSLError, requests.exceptions.ProxyError):
                response = requests.get(target_url, headers=headers, timeout=15, verify=False, allow_redirects=True)
            
            # If we get a 429 or other error, but the URL looks like a direct feed, try to salvage it
            is_likely_feed = any(target_url.lower().endswith(ext) for ext in ['.xml', '.rss', '.atom', '.json'])
            
            if response.status_code >= 400:
                if is_likely_feed:
                    # Return it anyway as a "Direct Feed" since the site is rate-limiting our search
                    return self.respond_with_feeds(request.user, [{
                        'title': f"Direct Feed: {target_url.split('/')[-1]}",
                        'url': target_url
                    }])
                return Response({'error': f'Website returned error {response.status_code}'}, status=status.HTTP_400_BAD_REQUEST)

            # 1. Check if the URL itself is a feed
            # Some feeds might return application/rss+xml which feedparser handles well
            content_type = response.headers.get('Content-Type', '').lower()
            is_xml = 'xml' in content_type or 'rss' in content_type or 'atom' in content_type or 'json' in content_type
            
            parsed_direct = feedparser.parse(response.content)
            if parsed_direct.version or is_xml:
                # Double check if it actually has entries or a title to be sure it's a feed
                if parsed_direct.feed.get('title') or len(parsed_direct.entries) > 0:
                    return self.respond_with_feeds(request.user, [{
                        'title': parsed_direct.feed.get('title', target_url),
                        'url': target_url
                    }])

            # 2. Look for feed links in HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            feed_links = []
            
            # Find RSS/Atom links in <link> tags
            types = [
                'application/rss+xml',
                'application/atom+xml',
                'application/feed+json',
                'application/json',
                'text/xml',
                'application/xml'
            ]
            
            for link in soup.find_all('link'):
                rel = link.get('rel', [])
                if isinstance(rel, str): rel = [rel]
                
                if ('alternate' in rel or 'feed' in rel) and (link.get('type') in types) and link.get('href'):
                    href = link.get('href')
                    full_url = urljoin(target_url, href)
                    feed_links.append({
                        'title': link.get('title') or soup.title.string if soup.title else target_url,
                        'url': full_url
                    })
            
            # Also check <a> tags that might point to feeds
            for a in soup.find_all('a', href=True):
                href = a['href'].lower()
                if any(ext in href for ext in ['.rss', '.atom', '/feed', '/rss']):
                    full_url = urljoin(target_url, a['href'])
                    feed_links.append({
                        'title': a.get_text().strip() or f"Feed from {target_url}",
                        'url': full_url
                    })

            # If no links found, try common paths as a last resort
            if not feed_links:
                common_paths = ['feed/', 'rss/', 'feed.xml', 'rss.xml', 'index.xml', 'atom.xml']
                parsed_url = urlparse(target_url)
                base_url = f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}"
                if not base_url.endswith('/'): base_url += '/'
                
                for path in common_paths:
                    try:
                        test_url = urljoin(base_url, path)
                        test_resp = requests.get(test_url, headers=headers, timeout=5)
                        if test_resp.status_code == 200:
                            test_parsed = feedparser.parse(test_resp.content)
                            if test_parsed.version:
                                feed_links.append({
                                    'title': test_parsed.feed.get('title', test_url),
                                    'url': test_url
                                })
                    except:
                        continue

            # Remove duplicates and normalize
            unique_feeds_map = {}
            for f in feed_links:
                url = f['url'].rstrip('/')
                if url not in unique_feeds_map:
                    unique_feeds_map[url] = f
            
            results = list(unique_feeds_map.values())
            if not results:
                return Response({'error': 'No feeds found at this URL'}, status=status.HTTP_404_NOT_FOUND)

            return self.respond_with_feeds(request.user, results)

        except requests.exceptions.RequestException as e:
            print(f"DEBUG: RequestException: {str(e)}")
            return Response({'error': f'Could not connect to website: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"DEBUG: Unexpected Exception: {str(e)}")
            return Response({'error': f'Search failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    def respond_with_feeds(self, user, feeds):
        followed_urls = set(Feed.objects.filter(user=user).values_list('url', flat=True))
        for feed in feeds:
            feed['is_followed'] = feed['url'] in followed_urls
            # Try to get existing feed ID for easier manipulation
            if feed['is_followed']:
                existing = Feed.objects.filter(user=user, url=feed['url']).first()
                if existing:
                    feed['id'] = existing.id
        return Response(feeds)

class UserSettingsView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSettingsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        settings, created = UserSettings.objects.get_or_create(user=self.request.user)
        return settings

class MarkArticleReadView(generics.CreateAPIView, generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        link = request.data.get('link')
        feed_id = request.data.get('feed_id')
        if not link:
             return Response({'error': 'Link required'}, status=status.HTTP_400_BAD_REQUEST)
        
        feed = None
        if feed_id:
            feed = Feed.objects.filter(id=feed_id, user=request.user).first()
            
        ReadArticle.objects.get_or_create(user=request.user, link=link, defaults={'feed': feed})
        return Response(status=status.HTTP_200_OK)

    def delete(self, request, *args, **kwargs):
        link = request.query_params.get('link')
        if not link:
            return Response({'error': 'Link required'}, status=status.HTTP_400_BAD_REQUEST)
        
        ReadArticle.objects.filter(user=request.user, link=link).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class MarkFeedReadView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        feed_id = request.data.get('feed_id')
        
        view_instance = FeedContentView()
        
        if feed_id:
            feeds = Feed.objects.filter(id=feed_id, user=request.user)
        else:
            feeds = Feed.objects.filter(user=request.user)
            
        for feed in feeds:
            data = view_instance.parse_feed_url(feed.url, feed.title)
            for entry in data['entries']:
                ReadArticle.objects.get_or_create(
                    user=request.user, 
                    link=entry['link'], 
                    defaults={'feed': feed}
                )
            
        return Response(status=status.HTTP_200_OK)

class SavedArticleListCreateView(generics.ListCreateAPIView):
    serializer_class = SavedArticleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SavedArticle.objects.filter(user=self.request.user)

    def post(self, request, *args, **kwargs):
        link = request.data.get('link')
        if SavedArticle.objects.filter(user=request.user, link=link).exists():
             return Response({'error': 'Already saved'}, status=status.HTTP_400_BAD_REQUEST)
        return super().post(request, *args, **kwargs)

class SavedArticleDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'link'

    def get_queryset(self):
        return SavedArticle.objects.filter(user=self.request.user)

    def delete(self, request, *args, **kwargs):
        link = request.query_params.get('link')
        instance = SavedArticle.objects.filter(user=request.user, link=link).first()
        if instance:
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(status=status.HTTP_404_NOT_FOUND)

class FeedListCreateView(generics.ListCreateAPIView):
    serializer_class = FeedSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Feed.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        
        # Calculate unread counts
        read_links = set(ReadArticle.objects.filter(user=request.user).values_list('link', flat=True))
        
        view_instance = FeedContentView()
        
        def process_feed(feed_data):
            try:
                feed_obj = Feed.objects.get(id=feed_data['id'])
                parsed = view_instance.parse_feed_url(feed_obj.url, feed_obj.title)
                unread = [e for e in parsed['entries'] if e['link'] not in read_links]
                feed_data['unread_count'] = len(unread)
            except Exception:
                feed_data['unread_count'] = 0

        with ThreadPoolExecutor(max_workers=10) as executor:
            executor.map(process_feed, data)
            
        return Response(data)

class FeedDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FeedSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Feed.objects.filter(user=self.request.user)

class FeedContentView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Feed.objects.filter(user=self.request.user)

    def get(self, request, *args, **kwargs):
        feed_obj = self.get_object()
        offset = int(request.query_params.get('offset', 0))
        unread_only = request.query_params.get('unread_only') == 'true'
        limit = 10
        
        data = self.parse_feed_url(feed_obj.url, feed_obj.title)
        entries = data['entries']
        
        read_links = set(ReadArticle.objects.filter(user=request.user).values_list('link', flat=True))
        saved_links = set(SavedArticle.objects.filter(user=request.user).values_list('link', flat=True))
        
        for entry in entries:
            entry['is_read'] = entry['link'] in read_links
            entry['is_saved'] = entry['link'] in saved_links
            entry['feed_id'] = feed_obj.id

        if unread_only:
            entries = [e for e in entries if not e['is_read']]
        
        # Slicing for pagination
        paginated_entries = entries[offset : offset + limit]
        
        return Response({
            'title': data['title'],
            'entries': paginated_entries,
            'has_more': len(entries) > (offset + limit)
        })

    def parse_feed_url(self, url, default_title):
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 PR-FYDD/1.0'
            }
            try:
                response = requests.get(url, headers=headers, timeout=10)
            except requests.exceptions.SSLError:
                response = requests.get(url, headers=headers, timeout=10, verify=False)
            
            parsed_feed = feedparser.parse(response.content)
            
            # Calculate 30-day cutoff
            cutoff_seconds = 30 * 24 * 60 * 60
            cutoff_timestamp = time.time() - cutoff_seconds

            entries = []
            for entry in parsed_feed.entries:
                content = ""
                if 'content' in entry:
                    content = entry.content[0].value
                elif 'summary' in entry:
                    content = entry.summary
                elif 'description' in entry:
                    content = entry.description

                # Handle date parsing for sorting
                dt_tuple = entry.get('published_parsed') or entry.get('updated_parsed') or time.gmtime()
                timestamp = time.mktime(dt_tuple)

                # 30-day Cutoff Check
                if timestamp < cutoff_timestamp:
                    continue

                # Extract Thumbnail
                thumbnail = None
                # Check media content
                if 'media_content' in entry and len(entry.media_content) > 0:
                    thumbnail = entry.media_content[0].get('url')
                # Check media thumbnail
                if not thumbnail and 'media_thumbnail' in entry and len(entry.media_thumbnail) > 0:
                    thumbnail = entry.media_thumbnail[0].get('url')
                # Check enclosures
                if not thumbnail and 'enclosures' in entry:
                    for enc in entry.enclosures:
                        if enc.get('type', '').startswith('image/'):
                            thumbnail = enc.get('href')
                            break
                # Check links
                if not thumbnail and 'links' in entry:
                    for link in entry.links:
                        if link.get('rel') == 'enclosure' and link.get('type', '').startswith('image/'):
                            thumbnail = link.get('href')
                            break

                entries.append({
                    'feed_title': parsed_feed.feed.get('title', default_title),
                    'title': entry.get('title', 'No Title'),
                    'link': entry.get('link', ''),
                    'summary': content,
                    'thumbnail': thumbnail,
                    'published': entry.get('published', entry.get('updated', '')),
                    'timestamp': timestamp
                })
            
            # Sort by timestamp closest first
            entries.sort(key=lambda x: x['timestamp'], reverse=True)
            
            return {
                'title': parsed_feed.feed.get('title', default_title),
                'entries': entries
            }
        except Exception as e:
            return {'title': default_title, 'entries': [], 'error': str(e)}

class AggregatedFeedContentView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        offset = int(request.query_params.get('offset', 0))
        unread_only = request.query_params.get('unread_only') == 'true'
        limit = 10
        
        user_feeds = Feed.objects.filter(user=request.user)
        unique_entries = {}
        
        view_instance = FeedContentView()
        read_links = set(ReadArticle.objects.filter(user=request.user).values_list('link', flat=True))
        saved_links = set(SavedArticle.objects.filter(user=request.user).values_list('link', flat=True))

        def fetch_and_process(feed_obj):
            data = view_instance.parse_feed_url(feed_obj.url, feed_obj.title)
            results = []
            for entry in data['entries']:
                entry['is_read'] = entry['link'] in read_links
                entry['is_saved'] = entry['link'] in saved_links
                entry['feed_id'] = feed_obj.id
                if unread_only and entry['is_read']:
                    continue
                results.append(entry)
            return results

        with ThreadPoolExecutor(max_workers=10) as executor:
            future_to_feed = [executor.submit(fetch_and_process, feed) for feed in user_feeds]
            for future in future_to_feed:
                try:
                    entries = future.result()
                    for entry in entries:
                        link = entry['link']
                        if link not in unique_entries:
                            unique_entries[link] = entry
                except Exception:
                    continue
        
        all_entries = list(unique_entries.values())
        
        # Global sort across all feeds
        all_entries.sort(key=lambda x: x['timestamp'], reverse=True)
        
        paginated_entries = all_entries[offset : offset + limit]
        
        return Response({
            'title': 'All Articles',
            'entries': paginated_entries,
            'has_more': len(all_entries) > (offset + limit)
        })
