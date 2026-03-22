from django.urls import path
from .views import (
    FeedListCreateView, 
    FeedDetailView, 
    FeedContentView, 
    AggregatedFeedContentView,
    SavedArticleListCreateView,
    SavedArticleDeleteView,
    MarkArticleReadView,
    MarkFeedReadView
)

urlpatterns = [
    path('', FeedListCreateView.as_view(), name='feed-list'),
    path('all-content/', AggregatedFeedContentView.as_view(), name='aggregated-content'),
    path('<int:pk>/', FeedDetailView.as_view(), name='feed-detail'),
    path('<int:pk>/content/', FeedContentView.as_view(), name='feed-content'),
    path('saved/', SavedArticleListCreateView.as_view(), name='saved-article-list-create'),
    path('saved/delete/', SavedArticleDeleteView.as_view(), name='saved-article-delete'),
    path('mark-read/', MarkArticleReadView.as_view(), name='mark-article-read'),
    path('mark-feed-read/', MarkFeedReadView.as_view(), name='mark-feed-read'),
]
