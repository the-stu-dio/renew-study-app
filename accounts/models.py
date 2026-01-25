from django.db import models
from django.contrib.auth.models import User

class ActivityNote(models.Model):
    """Model for notes within specific activities (like video notes)"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_notes')
    activity_name = models.CharField(max_length=200)  # "pos_p1", "pos_p2", etc.
    notes = models.TextField()
    source_url = models.CharField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.activity_name}"

class ActivityProgress(models.Model):
    """Universal progress tracking for any activity"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress')
    activity_id = models.CharField(max_length=100)  # 'pos_p1', 'pos_p2', 'neg_p1', etc.
    section = models.CharField(max_length=50)       # 'positive_events', 'negative_events', etc.
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    progress_percentage = models.IntegerField(default=0)  # 0-100
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'activity_id']  # One progress record per user per activity
    
    def __str__(self):
        return f"{self.user.username} - {self.activity_id} - {self.progress_percentage}%"

class Note(models.Model):
    """Model for user notes per section"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    section = models.CharField(max_length=20)  # 'section_1', 'section_2', etc.
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['user', 'section']  # One note per section per user
    
    def __str__(self):
        return f"{self.user.username} - {self.section}"

class StudySession(models.Model):
    """Track study sessions and time spent"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    section = models.CharField(max_length=20)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    time_spent_minutes = models.IntegerField(default=0)
    
    def __str__(self):
        return f"{self.user.username} - {self.section} - {self.started_at}"
        
# Add these new models to your existing models.py

class UserProfile(models.Model):
    """Extended user profile with additional information"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    date_joined_program = models.DateTimeField(auto_now_add=True)
    is_profile_complete = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.user.username}'s Profile"

class PositiveEventResponse(models.Model):
    """User responses to positive events categories"""
    CATEGORY_CHOICES = [
        ('recreation', 'Recreational Positive Events'),
        ('achievement', 'Achievement Positive Events'),
        ('relationship', 'Relationship Positive Events'),
        ('other', 'Other Types of Positive Events'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='positive_responses')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    response_text = models.TextField()
    is_hidden = models.BooleanField(default=False)  # User can hide responses
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'category']  # One response per category per user
        ordering = ['category']
    
    def __str__(self):
        return f"{self.user.username} - {self.get_category_display()}"
    
    @property
    def category_emoji(self):
        emojis = {
            'recreation': '🎮',
            'achievement': '🏆', 
            'relationship': '👥',
            'other': '✨'
        }
        return emojis.get(self.category, '📝')

class NegativeEventResponse(models.Model):
    """User responses to negative events categories"""
    CATEGORY_CHOICES = [
        ('adverse', 'Adverse Events'),
        ('neighbor', 'Neighborhood Issues'),
        ('discriminate', 'Discrimination'),
        ('stress', 'Stressors and Hassles'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='negative_responses')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    response_text = models.TextField()
    is_hidden = models.BooleanField(default=False)  # User can hide responses
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'category']  # One response per category per user
        ordering = ['category']
    
    def __str__(self):
        return f"{self.user.username} - {self.get_category_display()}"
    
    @property
    def category_emoji(self):
        emojis = {
            'adverse': '⚠️',
            'neighbor': '🏘️',
            'discriminate': '❌',
            'stress': '😰'
        }
        return emojis.get(self.category, '📝')
        
class FeedbackSurvey(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    statement1_checked = models.BooleanField(default=False)  # Environment impact - talk to someone
    statement2_checked = models.BooleanField(default=False)  # Environment impact - read more
    statement3_checked = models.BooleanField(default=False)  # Boring but interested in emotions talk
    statement4_checked = models.BooleanField(default=False)  # Not interesting/helpful
    submitted_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Feedback Survey - {self.user.username}"
        
class JournalingSurvey(models.Model):
    """Survey responses about journaling preferences"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='journaling_survey')
    
    # Survey response options
    share_family = models.BooleanField(default=False)      # Share with family/friend
    share_counselor = models.BooleanField(default=False)   # Share with counselor  
    like_private = models.BooleanField(default=False)      # Like writing, keep private
    prefer_talking = models.BooleanField(default=False)    # Prefer talking over writing
    dislike_both = models.BooleanField(default=False)      # Don't like writing or talking
    
    submitted_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Journaling Survey - {self.user.username}"
    
    @property 
    def selected_responses(self):
        """Return list of selected response labels"""
        responses = []
        if self.share_family:
            responses.append("Share with family/friend")
        if self.share_counselor:
            responses.append("Share with counselor")
        if self.like_private:
            responses.append("Like writing, keep private")
        if self.prefer_talking:
            responses.append("Prefer talking")
        if self.dislike_both:
            responses.append("Dislike both writing and talking")
        return responses

class PosplanResponse(models.Model):
    """User responses for positive planned activities"""
    STEP_CHOICES = [
        ('companion', 'Who - Companion Choice'),
        ('location', 'Where - Location Choice'),
        ('activity', 'What - Activity Choice'),
        ('timing', 'When - Timing Choice'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posplan_responses')
    step = models.CharField(max_length=20, choices=STEP_CHOICES)
    category = models.CharField(max_length=50, blank=True, null=True)  # For companion/location steps
    response_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'step']  # One response per step per user
        ordering = ['step']
    
    def __str__(self):
        return f"{self.user.username} - {self.get_step_display()}: {self.response_text[:50]}"
    
    @property
    def step_emoji(self):
        emojis = {
            'companion': '👥',
            'location': '📍', 
            'activity': '🎯',
            'timing': '⏰'
        }
        return emojis.get(self.step, '📝')
