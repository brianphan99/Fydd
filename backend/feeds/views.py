import feedparser
import requests
import time
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Feed
from .serializers import FeedSerializer

class FeedListCreateView(generics.ListCreateAPIView):
    serializer_class = FeedSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Feed.objects.filter(user=self.request.user)

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
        limit = 10
        
        data = self.parse_feed_url(feed_obj.url, feed_obj.title)
        entries = data['entries']
        
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

                entries.append({
                    'feed_title': parsed_feed.feed.get('title', default_title),
                    'title': entry.get('title', 'No Title'),
                    'link': entry.get('link', ''),
                    'summary': content,
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
        limit = 10
        
        user_feeds = Feed.objects.filter(user=request.user)
        all_entries = []
        
        view_instance = FeedContentView()
        for feed_obj in user_feeds:
            data = view_instance.parse_feed_url(feed_obj.url, feed_obj.title)
            all_entries.extend(data['entries'])
        
        # Global sort across all feeds
        all_entries.sort(key=lambda x: x['timestamp'], reverse=True)
        
        paginated_entries = all_entries[offset : offset + limit]
        
        return Response({
            'title': 'All Articles',
            'entries': paginated_entries,
            'has_more': len(all_entries) > (offset + limit)
        })
