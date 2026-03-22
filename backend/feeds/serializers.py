from rest_framework import serializers
from .models import Feed, SavedArticle

class FeedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feed
        fields = ['id', 'user', 'title', 'url', 'created_at']
        read_only_fields = ['user', 'created_at']

class SavedArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedArticle
        fields = ['id', 'user', 'feed_title', 'title', 'link', 'summary', 'published', 'timestamp', 'created_at']
        read_only_fields = ['user', 'created_at']


    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
