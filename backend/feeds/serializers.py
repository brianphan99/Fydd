from rest_framework import serializers
from .models import Feed, SavedArticle, ReadArticle

class FeedSerializer(serializers.ModelSerializer):
    unread_count = serializers.IntegerField(read_only=True, default=0)
    title = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Feed
        fields = ['id', 'user', 'title', 'url', 'created_at', 'unread_count']
        read_only_fields = ['user', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        
        if not validated_data.get('title'):
            # Lazy import to avoid circular dependency
            from .views import FeedContentView
            view = FeedContentView()
            url = validated_data.get('url')
            try:
                parsed = view.parse_feed_url(url, 'New Feed')
                validated_data['title'] = parsed.get('title', 'New Feed')
            except Exception:
                validated_data['title'] = 'New Feed'
                
        return super().create(validated_data)

class SavedArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedArticle
        fields = ['id', 'user', 'feed_title', 'title', 'link', 'summary', 'thumbnail', 'published', 'timestamp', 'created_at']
        read_only_fields = ['user', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class ReadArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReadArticle
        fields = ['id', 'user', 'link', 'feed', 'created_at']
        read_only_fields = ['user', 'created_at', 'id']
