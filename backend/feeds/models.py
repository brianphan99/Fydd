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
    link = models.URLField(max_length=1000)
    summary = models.TextField(blank=True)
    thumbnail = models.URLField(max_length=1000, blank=True, null=True)
    published = models.CharField(max_length=100, blank=True)
    timestamp = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class ReadArticle(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='read_articles')
    link = models.URLField(max_length=500)
    feed = models.ForeignKey(Feed, on_delete=models.CASCADE, related_name='read_entries', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'link')

    def __str__(self):
        return f"{self.user.username} read {self.link}"
