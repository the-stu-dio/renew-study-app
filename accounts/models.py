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
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='positive_responses', null=True, blank=True)
    session_key = models.CharField(max_length=100, blank=True, null=True)  # Track anonymous users
    nickname = models.CharField(max_length=100, blank=True, null=True)  # User's chosen nickname
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    response_text = models.TextField()
    is_hidden = models.BooleanField(default=False)  # User can hide responses
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['session_key', 'category']  # One response per category per session
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
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='negative_responses', null=True, blank=True)
    session_key = models.CharField(max_length=100, blank=True, null=True)
    nickname = models.CharField(max_length=100, blank=True, null=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    response_text = models.TextField()
    is_hidden = models.BooleanField(default=False)  # User can hide responses
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['session_key', 'category']  # One response per category per session
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

class PMRSurveyResponse(models.Model):
    """User responses to the PMR body feeling survey"""
    FEELING_CHOICES = [
        ('relaxed', 'Relaxed'),
        ('stressed', 'More stressed than ever'),
        ('same', 'Kind of the same as before'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pmr_responses', null=True, blank=True)
    session_key = models.CharField(max_length=100, blank=True, null=True)
    nickname = models.CharField(max_length=100, blank=True, null=True)
    selected_feelings = models.JSONField(default=list)  # List of selected options
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # One response per session
        unique_together = ['session_key']

    def __str__(self):
        return f"PMR Survey - {self.session_key} - {self.selected_feelings}"


class AttentionCheckResponse(models.Model):
    """Track incorrect attempts on attention check quiz questions"""
    QUESTION_CHOICES = [
        ('neg_p6_q1', 'Why might Mike react more to Coach Ramos\'s comments?'),
        ('neg_p7_q1', 'How might Mike be feeling after Coach Ramos\'s comment?'),
        ('emo_p2_q1', 'Dave is sad because angry thoughts'),
        ('emo_p2_q2', 'Avoiding friends like Dave'),
        ('emo_p2_q3', 'Strange Dave fighting mom'),
        ('emo_p2_q4', 'Dave triggered'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attention_checks', null=True, blank=True)
    session_key = models.CharField(max_length=100, blank=True, null=True)
    nickname = models.CharField(max_length=100, blank=True, null=True)
    question_id = models.CharField(max_length=20, choices=QUESTION_CHOICES)
    incorrect_attempts = models.IntegerField(default=0)
    answered_correctly = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['session_key', 'question_id']
        ordering = ['question_id']

    def __str__(self):
        return f"Attention Check - {self.question_id} - {self.incorrect_attempts} wrong"


class IronSpongeResponse(models.Model):
    """Per-domain results of the Iron & Sponge quiz (neg_p9)"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='iron_sponge_responses', null=True, blank=True)
    session_key = models.CharField(max_length=100, blank=True, null=True)
    nickname = models.CharField(max_length=100, blank=True, null=True)

    # Domain types: 'iron', 'sponge', or 'balanced'
    school_type = models.CharField(max_length=20, blank=True, null=True)
    school_iron = models.IntegerField(default=0)
    school_sponge = models.IntegerField(default=0)
    school_neither = models.IntegerField(default=0)

    friend_type = models.CharField(max_length=20, blank=True, null=True)
    friend_iron = models.IntegerField(default=0)
    friend_sponge = models.IntegerField(default=0)
    friend_neither = models.IntegerField(default=0)

    family_type = models.CharField(max_length=20, blank=True, null=True)
    family_iron = models.IntegerField(default=0)
    family_sponge = models.IntegerField(default=0)
    family_neither = models.IntegerField(default=0)

    # Full raw responses as JSON (question1–question9)
    responses_json = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['session_key']

    def __str__(self):
        return f"Iron/Sponge - {self.session_key} - school:{self.school_type} friend:{self.friend_type} family:{self.family_type}"


class PosplanActivityResponse(models.Model):
    """Session-based positive planned activity responses (Who/Where/What/When)"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posplan_activity_responses', null=True, blank=True)
    session_key = models.CharField(max_length=100, blank=True, null=True)
    nickname = models.CharField(max_length=100, blank=True, null=True)
    who = models.TextField(blank=True, default='')
    where = models.TextField(blank=True, default='')
    what = models.TextField(blank=True, default='')
    when = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['session_key']

    def __str__(self):
        return f"PosplanActivity - {self.session_key} - Who:{self.who[:20]} What:{self.what[:20]}"


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
