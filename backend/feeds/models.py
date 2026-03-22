from django.db import models
from django.contrib.auth.models import User

class Feed(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feeds')
    title = models.CharField(max_length=255)
    url = models.URLField()
    content = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class SavedArticle(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_articles')
    feed_title = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    link = models.URLField()
    summary = models.TextField(blank=True)
    published = models.CharField(max_length=100, blank=True)
    timestamp = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
