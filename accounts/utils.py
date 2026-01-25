# accounts/utils.py
from django.utils import timezone
from .models import ActivityProgress, ActivityNote, StudySession

class ProgressTracker:
    """Universal progress tracking helper"""
    
    @staticmethod
    def mark_activity_completed(user, activity_id, section):
        """Mark an activity as completed"""
        progress, created = ActivityProgress.objects.get_or_create(
            user=user,
            activity_id=activity_id,
            defaults={
                'section': section,
                'completed': True,
                'completed_at': timezone.now(),
                'progress_percentage': 100
            }
        )
        
        if not created and not progress.completed:
            progress.completed = True
            progress.completed_at = timezone.now()
            progress.progress_percentage = 100
            progress.save()
        
        return progress
    
    @staticmethod
    def update_activity_progress(user, activity_id, section, percentage):
        """Update activity progress percentage"""
        progress, created = ActivityProgress.objects.get_or_create(
            user=user,
            activity_id=activity_id,
            defaults={
                'section': section,
                'progress_percentage': percentage
            }
        )
        
        if not created:
            progress.progress_percentage = max(progress.progress_percentage, percentage)
            if percentage >= 100:
                progress.completed = True
                progress.completed_at = timezone.now()
            progress.save()
        
        return progress
    
    @staticmethod
    def is_activity_completed(user, activity_id):
        """Check if activity is completed"""
        try:
            progress = ActivityProgress.objects.get(user=user, activity_id=activity_id)
            return progress.completed
        except ActivityProgress.DoesNotExist:
            return False
    
    @staticmethod
    def get_section_progress(user, section):
        """Get overall progress for a section (e.g., 'positive_events')"""
        activities = ActivityProgress.objects.filter(user=user, section=section)
        if not activities.exists():
            return 0
        
        total_percentage = sum(activity.progress_percentage for activity in activities)
        return total_percentage // activities.count()
    
    @staticmethod
    def is_section_unlocked(user, section):
        """Check if a section is unlocked based on previous section completion"""
        section_order = {
            'positive_events': None,  # Always unlocked
            'negative_events': 'positive_events',
            'skills': 'negative_events',
            'final_challenge': 'skills'
        }
        
        prerequisite = section_order.get(section)
        if not prerequisite:
            return True  # No prerequisite, always unlocked
        
        # Check if prerequisite section is completed (80% threshold)
        return ProgressTracker.get_section_progress(user, prerequisite) >= 80
    
    @staticmethod
    def get_user_overview(user):
        """Get complete progress overview for user"""
        sections = ['positive_events', 'negative_events', 'skills', 'final_challenge']
        overview = {}
        
        for section in sections:
            overview[section] = {
                'progress': ProgressTracker.get_section_progress(user, section),
                'unlocked': ProgressTracker.is_section_unlocked(user, section),
                'activities': ActivityProgress.objects.filter(user=user, section=section)
            }
        
        return overview

class TimeTracker:
    """Time tracking for pages and activities"""
    
    @staticmethod
    def start_session(user, section, activity_id=None, page_url=None):
        """Start a new study session"""
        # End any existing active sessions for this user
        TimeTracker.end_active_sessions(user)
        
        # Create new session
        session = StudySession.objects.create(
            user=user,
            section=section,
            activity_id=activity_id,
            page_url=page_url,
            started_at=timezone.now(),
            is_active=True
        )
        
        return session
    
    @staticmethod
    def end_session(user, session_id=None):
        """End a specific session or the most recent active session"""
        if session_id:
            try:
                session = StudySession.objects.get(id=session_id, user=user, is_active=True)
            except StudySession.DoesNotExist:
                return None
        else:
            # End most recent active session
            session = StudySession.objects.filter(
                user=user, 
                is_active=True
            ).order_by('-started_at').first()
        
        if session:
            session.ended_at = timezone.now()
            session.is_active = False
            
            # Calculate time spent in minutes
            time_delta = session.ended_at - session.started_at
            session.time_spent_minutes = int(time_delta.total_seconds() / 60)
            session.save()
            
            return session
        
        return None
    
    @staticmethod
    def end_active_sessions(user):
        """End all active sessions for a user"""
        active_sessions = StudySession.objects.filter(user=user, is_active=True)
        now = timezone.now()
        
        for session in active_sessions:
            session.ended_at = now
            session.is_active = False
            time_delta = session.ended_at - session.started_at
            session.time_spent_minutes = int(time_delta.total_seconds() / 60)
            session.save()
    
    @staticmethod
    def get_user_time_stats(user):
        """Get time statistics for a user"""
        sessions = StudySession.objects.filter(user=user, ended_at__isnull=False)
        
        total_time = sum(session.time_spent_minutes for session in sessions)
        
        # Time by section
        sections = {}
        for session in sessions:
            section = session.section
            if section not in sections:
                sections[section] = 0
            sections[section] += session.time_spent_minutes
        
        # Time by activity
        activities = {}
        for session in sessions.filter(activity_id__isnull=False):
            activity = session.activity_id
            if activity not in activities:
                activities[activity] = 0
            activities[activity] += session.time_spent_minutes
        
        return {
            'total_minutes': total_time,
            'total_hours': round(total_time / 60, 1),
            'sections': sections,
            'activities': activities,
            'session_count': sessions.count()
        }
    
    @staticmethod
    def get_current_session(user):
        """Get user's current active session"""
        return StudySession.objects.filter(
            user=user, 
            is_active=True
        ).order_by('-started_at').first()
    
    @staticmethod
    def update_session_heartbeat(user, session_id=None):
        """Update session to show user is still active"""
        if session_id:
            try:
                session = StudySession.objects.get(id=session_id, user=user, is_active=True)
                # Just accessing the session updates the last activity
                # You could add a last_activity field if needed
                return session
            except StudySession.DoesNotExist:
                return None
        return None