import feedparser
import requests
import time
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Feed, SavedArticle, ReadArticle
from .serializers import FeedSerializer, SavedArticleSerializer, ReadArticleSerializer

class MarkArticleReadView(generics.CreateAPIView):
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
        for feed_data in data:
            feed_obj = Feed.objects.get(id=feed_data['id'])
            parsed = view_instance.parse_feed_url(feed_obj.url, feed_obj.title)
            unread = [e for e in parsed['entries'] if e['link'] not in read_links]
            feed_data['unread_count'] = len(unread)
            
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
        
        for entry in entries:
            entry['is_read'] = entry['link'] in read_links
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
        all_entries = []
        
        view_instance = FeedContentView()
        read_links = set(ReadArticle.objects.filter(user=request.user).values_list('link', flat=True))

        for feed_obj in user_feeds:
            data = view_instance.parse_feed_url(feed_obj.url, feed_obj.title)
            for entry in data['entries']:
                entry['is_read'] = entry['link'] in read_links
                entry['feed_id'] = feed_obj.id
                if unread_only and entry['is_read']:
                    continue
                all_entries.append(entry)
        
        # Global sort across all feeds
        all_entries.sort(key=lambda x: x['timestamp'], reverse=True)
        
        paginated_entries = all_entries[offset : offset + limit]
        
        return Response({
            'title': 'All Articles',
            'entries': paginated_entries,
            'has_more': len(all_entries) > (offset + limit)
        })
