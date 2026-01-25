# accounts/urls.py
from django.urls import path
from . import views
urlpatterns = [
    path('', views.landing_page_view, name='landing'),  
    path('intro-1/', views.intro_video_1_view, name='intro_video_1'), 
    path('intro-2/', views.intro_video_2_view, name='intro_video_2'),
    
    path('nickname/', views.nickname_view, name='nickname'),
    path('welcome/', views.welcome_view, name='welcome'),
    path('hub/', views.hub_view, name='hub'),
    path('profile/', views.profile_view, name='profile'),  # NEW: Profile page
   
    path('adventure-map/', views.adventure_map_view, name='adventure_map'),
    
    # Positive Events
    path('pos-p1/', views.pos_p1_view, name='pos_p1'),
    path('pos-p2/', views.pos_p2_view, name='pos_p2'),
    path('pos-p3/', views.pos_p3_view, name='pos_p3'),
    path('pos-p4/', views.pos_p4_view, name='pos_p4'),
    path('pos-p5/', views.pos_p5_view, name='pos_p5'),
    
    
    # Negative Events
    path('neg-p1/', views.neg_p1_view, name='neg_p1'),
    path('neg-p2/', views.neg_p2_view, name='neg_p2'),
    path('neg-p3/', views.neg_p3_view, name='neg_p3'),
    path('neg-p4/', views.neg_p4_view, name='neg_p4'),
    path('neg-p5/', views.neg_p5_view, name='neg_p5'),
    path('neg-p6/', views.neg_p6_view, name='neg_p6'),
    path('neg-p7/', views.neg_p7_view, name='neg_p7'),
    path('neg-p8/', views.neg_p8_view, name='neg_p8'),
    path('neg-p9/', views.neg_p9_view, name='neg_p9'),
    path('neg-p10/', views.neg_p10_view, name='neg_p10'),
    
    # Thoughts & Emotions
    path('emo-p1/', views.emo_p1_view, name='emo_p1'),
    path('emo-p2/', views.emo_p2_view, name='emo_p2'),
    path('emo-p3/', views.emo_p3_view, name='emo_p3'),
    path('emo-p4/', views.emo_p4_view, name='emo_p4'),
    path('emo-p5/', views.emo_p5_view, name='emo_p5'),
    
    # Skills Section
    path('skill-p1/', views.skill_p1_view, name='skill_p1'),  
    path('skill-p2/', views.skill_p2_view, name='skill_p2'),
    path('skill-p3/', views.skill_p3_view, name='skill_p3'),
    path('skill-p4/', views.skill_p4_view, name='skill_p4'),
   
    
    path('pmr-p1/', views.pmr_p1_view, name='pmr_p1'),
    path('journal-p1/', views.journal_p1_view, name='journal_p1'),
    path('journal-p2/', views.journal_p2_view, name='journal_p2'),
    path('journal-option1/', views.journal_option1_view, name='journal_option1'),  # Things I Want to Work On
    path('journal-option2/', views.journal_option2_view, name='journal_option2'),  # Experiences That Shaped Me
    path('posplan-p1/', views.posplan_p1_view, name='posplan_p1'),
    path('posplan-p2/', views.posplan_p2_view, name='posplan_p2'),
    path('posplan-p3/', views.posplan_p3_view, name='posplan_p3'),
    path('posplan-p4/', views.posplan_p4_view, name='posplan_p4'),
    path('posplan-p5/', views.posplan_p5_view, name='posplan_p5'),
    path('posplan-summary-p1/', views.posplan_summary_p1_view, name='posplan_summary_p1'),
    path('posplan-summary-p2/', views.posplan_summary_p2_view, name='posplan_summary_p2'),
    path('posplan-summary-p3/', views.posplan_summary_p3_view, name='posplan_summary_p3'),
    path('posplan-summary-p4/', views.posplan_summary_p4_view, name='posplan_summary_p4'),
    path('get-posplan-summary/', views.get_posplan_summary, name='get_posplan_summary'),
    
    path('tips/', views.tips, name='tips'),
    path('discoveries/', views.discoveries_view, name='discoveries'),
    
    path('mark-video-complete/', views.mark_video_complete, name='mark_video_complete'),
    path('submit-feedback-survey/', views.submit_feedback_survey, name='submit_feedback_survey'),
    path('submit-journaling-survey/', views.submit_journaling_survey, name='submit_journaling_survey'),
    path('submit-pmr-survey/', views.submit_pmr_survey, name='submit_pmr_survey'),
    
    path('export-to-qualtrics/', views.export_to_qualtrics, name='export_to_qualtrics'),
    path('final-survey/', views.qualtrics_survey_view, name='qualtrics_survey'),
   
    path('completion-video/', views.completion_video, name='completion_video'),
]