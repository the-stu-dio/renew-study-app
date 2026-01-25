from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import uuid
from django.template.loader import render_to_string

def landing_page_view(request):
    """Landing page - first page visitors see"""
    return render(request, 'accounts/landing.html')

def intro_video_1_view(request):
    """First intro video page"""
    return render(request, 'accounts/intro_video_1.html')

def intro_video_2_view(request):
    """Second intro video page"""
    return render(request, 'accounts/intro_video_2.html')

def nickname_view(request):
    """Set user nickname - stored in localStorage"""
    return render(request, 'accounts/nickname.html')

def welcome_view(request):
    """Welcome page after setting nickname"""
    return render(request, 'accounts/welcome.html')

def hub_view(request):
    """Main hub page"""
    return render(request, 'accounts/hub.html')

def profile_view(request):
    """User profile page - data loaded from localStorage"""
    return render(request, 'accounts/profile.html')

def adventure_map_view(request):
    """Adventure map showing progress"""
    return render(request, 'accounts/adventure_map.html')

# Positive Events Views
def pos_p1_view(request):
    """Positive Events Part 1"""
    return render(request, 'accounts/pos_p1.html')

def pos_p2_view(request):
    """Positive Events Part 2"""
    return render(request, 'accounts/pos_p2.html')

def pos_p3_view(request):
    """Positive Events Part 3"""
    return render(request, 'accounts/pos_p3.html')

def pos_p4_view(request):
    """Positive Events Part 4"""
    return render(request, 'accounts/pos_p4.html')
    
def pos_p5_view(request):
    """Positive Events Part 5 - Interactive Cards"""
    return render(request, 'accounts/pos_p5.html')
    
# Negative Events Views
def neg_p1_view(request):
    """Negative Events Part 1"""
    return render(request, 'accounts/neg_p1.html')

def neg_p2_view(request):
    """Negative Events Part 2"""
    return render(request, 'accounts/neg_p2.html')

def neg_p3_view(request):
    """Negative Events Part 3"""
    return render(request, 'accounts/neg_p3.html')

def neg_p4_view(request):
    """Negative Events Part 4 - Interactive Cards"""
    return render(request, 'accounts/neg_p4.html')

def neg_p5_view(request):
    """Negative Events Part 5"""
    return render(request, 'accounts/neg_p5.html')

def neg_p6_view(request):
    """Negative Events Part 6"""
    return render(request, 'accounts/neg_p6.html')

def neg_p7_view(request):
    """Negative Events Part 7"""
    return render(request, 'accounts/neg_p7.html')

def neg_p8_view(request):
    """Negative Events Part 8"""
    return render(request, 'accounts/neg_p8.html')

def neg_p9_view(request):
    """Negative Events Part 9"""
    return render(request, 'accounts/neg_p9.html')

def neg_p10_view(request):
    """Negative Events Part 10 - Quiz"""
    return render(request, 'accounts/neg_p10.html')

# Thoughts & Emotions Views
def emo_p1_view(request):
    """Thoughts and Feelings Part 1"""
    return render(request, 'accounts/emo_p1.html')

def emo_p2_view(request):
    """Thoughts and Feelings Part 2"""
    return render(request, 'accounts/emo_p2.html')

def emo_p3_view(request):
    """Thoughts and Feelings Part 3"""
    return render(request, 'accounts/emo_p3.html')

def emo_p4_view(request):
    """Thoughts and Feelings Part 4"""
    return render(request, 'accounts/emo_p4.html')

def emo_p5_view(request):
    """Thoughts and Feelings Part 5"""
    return render(request, 'accounts/emo_p5.html')

# Skills Views
def skill_p1_view(request):
    """Skills Part 1"""
    return render(request, 'accounts/skill_p1.html')

def skill_p2_view(request):
    """Skills Part 2"""
    return render(request, 'accounts/skill_p2.html')
    
def skill_p3_view(request):
    """Skills Part 3"""
    return render(request, 'accounts/skill_p3.html')

def skill_p4_view(request):
    """Skills Part 4 - Three Skill Categories Overview"""
    return render(request, 'accounts/skill_p4.html')

def journal_p1_view(request):
    """Journaling Part 1"""
    return render(request, 'accounts/journal_p1.html')

def journal_p2_view(request):
    """Journaling Part 2"""
    return render(request, 'accounts/journal_p2.html')

def journal_option1_view(request):
    """Journaling Option 1 - Things I Want to Work On"""
    return render(request, 'accounts/journal_option1.html')

def journal_option2_view(request):
    """Journaling Option 2 - Experiences That Shaped Me"""
    return render(request, 'accounts/journal_option2.html')

def posplan_p1_view(request):
    """Positive Planned Activities Part 1"""
    return render(request, 'accounts/posplan_p1.html')

def posplan_p2_view(request):
    """Positive Planned Activities Part 2 - Who"""
    return render(request, 'accounts/posplan_p2.html')

def posplan_p3_view(request):
    """Positive Planned Activities Part 3 - Where"""
    return render(request, 'accounts/posplan_p3.html')

def posplan_p4_view(request):
    """Positive Planned Activities Part 4 - What Activity"""
    return render(request, 'accounts/posplan_p4.html')

def posplan_p5_view(request):
    """Positive Planned Activities Part 5 - When/Timing"""
    return render(request, 'accounts/posplan_p5.html')

def posplan_summary_p1_view(request):
    """Positive Planned Activities - Summary Part 1"""
    return render(request, 'accounts/posplan_summary_p1.html')
    
def posplan_summary_p2_view(request):
    """Positive Planned Activities - Summary Part 2"""
    return render(request, 'accounts/posplan_summary_p2.html')

def posplan_summary_p3_view(request):
    """Positive Planned Activities - Summary Part 3"""
    return render(request, 'accounts/posplan_summary_p3.html')

def posplan_summary_p4_view(request):
    """Positive Planned Activities - Summary Part 4"""
    return render(request, 'accounts/posplan_summary_p4.html')

def pmr_p1_view(request):
    """Progressive Muscle Relaxation Part 1"""
    return render(request, 'accounts/pmr_p1.html')

def discoveries_view(request):
    """My Discoveries page - data loaded from localStorage"""
    return render(request, 'accounts/discoveries.html')

def tips(request):
    return render(request, 'accounts/tips.html')

# Optional: Keep these endpoints for backwards compatibility, but they won't be used
@csrf_exempt
def mark_video_complete(request):
    """AJAX endpoint - now handled by localStorage, but keeping for compatibility"""
    if request.method == 'POST':
        return JsonResponse({'success': True, 'message': 'Handled by localStorage'})
    return JsonResponse({'error': 'Invalid method'}, status=405)

def submit_feedback_survey(request):
    """Handle feedback survey - now handled by localStorage"""
    if request.method == 'POST':
        return JsonResponse({'success': True, 'message': 'Handled by localStorage'})
    return JsonResponse({'error': 'Invalid method'}, status=405)

def submit_journaling_survey(request):
    """Handle journaling survey - now handled by localStorage"""
    if request.method == 'POST':
        return JsonResponse({'success': True, 'message': 'Handled by localStorage'})
    return JsonResponse({'error': 'Invalid method'}, status=405)

def submit_pmr_survey(request):
    """Handle PMR survey - now handled by localStorage"""
    if request.method == 'POST':
        return JsonResponse({'success': True, 'message': 'Handled by localStorage'})
    return JsonResponse({'error': 'Invalid method'}, status=405)

def get_posplan_summary(request):
    """AJAX endpoint - now handled by localStorage"""
    if request.method == 'GET':
        return JsonResponse({'success': True, 'message': 'Handled by localStorage'})
    return JsonResponse({'error': 'Invalid method'}, status=405)

# New endpoint for Qualtrics export
# Replace your existing export_to_qualtrics function with this enhanced version

@csrf_exempt
def export_to_qualtrics(request):
    """Export data to Qualtrics - receives localStorage data from frontend"""
    if request.method == 'POST':
        try:
            # Receive the localStorage data from the frontend
            data = json.loads(request.body)
            
            # Generate a participant ID for tracking
            participant_id = str(uuid.uuid4())[:8]  # Short ID
            
            # Extract main renew_study_data
            renew_data = data.get('renew_study_data', {})
            
            # Extract ironSpongeResults
            iron_sponge_data = data.get('ironSpongeResults', {})
            
            # Process journal entries
            journal_entries = renew_data.get('journal_entries', {})
            journal_things_to_change = journal_entries.get('things_to_change', {}).get('content', '')
            
            # Process experiences journal (JSON format)
            experiences_content = journal_entries.get('experiences_shaped_me', {}).get('content', '')
            journal_answers = {}
            if experiences_content:
                try:
                    parsed_experiences = json.loads(experiences_content)
                    journal_answers = {
                        'answer1': parsed_experiences.get('answer1', ''),
                        'answer2': parsed_experiences.get('answer2', ''),
                        'answer3': parsed_experiences.get('answer3', ''),
                        'answer4': parsed_experiences.get('answer4', '')
                    }
                except json.JSONDecodeError:
                    journal_answers = {'raw_content': experiences_content}
            
            # Add things_to_change to journal_answers
            journal_answers['things_to_change'] = journal_things_to_change
            
            # Process posplan responses
            posplan_responses = renew_data.get('posplan_responses', {})
            
            # Process survey responses
            survey_responses = renew_data.get('survey_responses', {})
            feedback_survey = survey_responses.get('feedback_survey', {})
            journaling_survey = survey_responses.get('journaling_survey', {})
            pmr_survey = survey_responses.get('pmr_survey', {})
            pmr_sidebar_survey = survey_responses.get('pmr_sidebar_survey', {})
            posplan_survey = renew_data.get('posplan_survey', {})
            
            # Extract additional teaching survey data
            additional_teaching_survey = renew_data.get('additional_teaching_survey', {})
            
            # Debug: Print all survey response keys to help identify missing data
            print("All survey response keys:", list(survey_responses.keys()))
            print("Additional teaching survey:", additional_teaching_survey)
            
            # Process Iron & Sponge results
            iron_sponge_summary = {}
            iron_sponge_questions = {}
            
            if iron_sponge_data:
                # Domain summaries
                for domain in ['school', 'family', 'friend']:
                    domain_data = iron_sponge_data.get(domain, {})
                    if domain_data:
                        iron_sponge_summary[f'{domain}_type'] = domain_data.get('type', '')
                        counts = domain_data.get('counts', {})
                        percentages = domain_data.get('percentages', {})
                        iron_sponge_summary[f'{domain}_iron_count'] = counts.get('iron', 0)
                        iron_sponge_summary[f'{domain}_sponge_count'] = counts.get('sponge', 0)
                        iron_sponge_summary[f'{domain}_neither_count'] = counts.get('neither', 0)
                        iron_sponge_summary[f'{domain}_iron_percentage'] = percentages.get('iron', 0)
                        iron_sponge_summary[f'{domain}_sponge_percentage'] = percentages.get('sponge', 0)
                        iron_sponge_summary[f'{domain}_neither_percentage'] = percentages.get('neither', 0)
                
                # Individual question responses
                responses = iron_sponge_data.get('responses', {})
                for question_id, response_data in responses.items():
                    iron_sponge_questions[f'{question_id}_value'] = response_data.get('value', '')
                    iron_sponge_questions[f'{question_id}_domain'] = response_data.get('domain', '')
            
            # Build comprehensive data summary
            comprehensive_data = {
                # Basic info
                'participant_id': participant_id,
                'nickname': renew_data.get('nickname', ''),
                'started_at': renew_data.get('started_at', ''),
                
                # Completion status
                'completed_sections': ','.join(renew_data.get('completed_sections', [])),
                'sections_completed_count': len(renew_data.get('completed_sections', [])),
                
                # Response data
                'pos_recreation': renew_data.get('responses', {}).get('positive_events', {}).get('recreation', ''),
                'pos_achievement': renew_data.get('responses', {}).get('positive_events', {}).get('achievement', ''),
                'pos_relationship': renew_data.get('responses', {}).get('positive_events', {}).get('relationship', ''),
                'pos_other': renew_data.get('responses', {}).get('positive_events', {}).get('other', ''),
                'neg_adverse': renew_data.get('responses', {}).get('negative_events', {}).get('adverse', ''),
                'neg_neighbor': renew_data.get('responses', {}).get('negative_events', {}).get('neighbor', ''),
                'neg_discriminate': renew_data.get('responses', {}).get('negative_events', {}).get('discriminate', ''),
                'neg_stress': renew_data.get('responses', {}).get('negative_events', {}).get('stress', ''),
                
                # Journal entries
                'journal_things_to_change': journal_things_to_change,
                'journal_answer1': journal_answers.get('answer1', ''),
                'journal_answer2': journal_answers.get('answer2', ''),
                'journal_answer3': journal_answers.get('answer3', ''),
                'journal_answer4': journal_answers.get('answer4', ''),
                
                # Activity plan
                'posplan_who_category': posplan_responses.get('who', {}).get('category', ''),
                'posplan_who_response': posplan_responses.get('who', {}).get('response', ''),
                'posplan_where_category': posplan_responses.get('where', {}).get('category', ''),
                'posplan_where_response': posplan_responses.get('where', {}).get('response', ''),
                'posplan_what_activity': posplan_responses.get('what', {}).get('activity', ''),
                'posplan_when_timing': posplan_responses.get('when', {}).get('timing', ''),
                
                # Survey responses
                'feedback_statement1': feedback_survey.get('statement1', False),
                'feedback_statement2': feedback_survey.get('statement2', False),
                'feedback_statement3': feedback_survey.get('statement3', False),
                'feedback_statement4': feedback_survey.get('statement4', False),
                'journaling_preferences': ','.join(journaling_survey.get('responses', [])),
                'pmr_selected_options': ','.join(pmr_survey.get('selected_options', [])),
                'pmr_activity_id': pmr_survey.get('activity_id', ''),
                'posplan_sharing_preference': posplan_survey.get('sharing_preference', ''),
                'posplan_feeling': posplan_survey.get('feeling', ''),
                'posplan_sub_option': posplan_survey.get('sub_option', ''),
                
                # PMR sidebar survey data
                'pmr_selected_feelings': ','.join(pmr_sidebar_survey.get('selected_feelings', [])),
                
                # Journaling survey responses (more detailed)
                'journaling_survey_responses': json.dumps(journaling_survey),
                
                # Teaching survey data (entire object as JSON)
                'additional_teaching_survey': json.dumps(additional_teaching_survey),
                
                 # Individual privacy settings (entire object as JSON)
                'individual_privacy_settings': json.dumps(individual_privacy_settings),
                
                # Privacy settings
                'privacy_positive_events': renew_data.get('privacy_settings', {}).get('positive_events', False),
                'privacy_negative_events': renew_data.get('privacy_settings', {}).get('negative_events', False),
                'privacy_quiz_results': renew_data.get('privacy_settings', {}).get('quiz_results', False),
                'privacy_journal_responses': renew_data.get('privacy_settings', {}).get('journal_responses', False),
                'privacy_activity_plan': renew_data.get('privacy_settings', {}).get('activity_plan', False),
                
                # Iron & Sponge timestamp
                'iron_sponge_timestamp': iron_sponge_data.get('timestamp', ''),
            }
            
            # Add Iron & Sponge domain results
            comprehensive_data.update(iron_sponge_summary)
            
            # Add Iron & Sponge question responses
            comprehensive_data.update(iron_sponge_questions)
            
            # Calculate Iron & Sponge totals
            if iron_sponge_data.get('responses'):
                responses = iron_sponge_data['responses']
                total_iron = sum(1 for r in responses.values() if r.get('value') == 'iron')
                total_sponge = sum(1 for r in responses.values() if r.get('value') == 'sponge')
                total_neither = sum(1 for r in responses.values() if r.get('value') == 'neither')
                
                comprehensive_data.update({
                    'iron_sponge_total_iron_responses': total_iron,
                    'iron_sponge_total_sponge_responses': total_sponge,
                    'iron_sponge_total_neither_responses': total_neither
                })
            
            # Render the HTML summary for Qualtrics
            try:
                summary_html = render_to_string('accounts/qualtrics_summary.html', {
                    'nickname': renew_data.get('nickname', 'Anonymous'),
                    'participant_id': participant_id,
                    'sections_completed_count': len(renew_data.get('completed_sections', [])),
                    'positive_events': renew_data.get('responses', {}).get('positive_events', {}),
                    'negative_events': renew_data.get('responses', {}).get('negative_events', {}),
                    'journal_entries': journal_answers,
                    'activity_plan': posplan_responses,
                    'iron_sponge': iron_sponge_summary,
                })
            except Exception as e:
                print(f"Error rendering template: {e}")
                summary_html = f"<p>Error rendering summary for participant {participant_id}</p>"
            
            return JsonResponse({
                'success': True,
                'message': 'Data received for Qualtrics export',
                'participant_id': participant_id,
                'data_summary': {
                    'has_nickname': bool(renew_data.get('nickname')),
                    'sections_completed': len(renew_data.get('completed_sections', [])),
                    'total_notes': len(renew_data.get('notes', {})),
                    'has_quiz_results': bool(renew_data.get('quiz_results')),
                    'has_responses': bool(renew_data.get('responses')),
                    'has_journal_entries': bool(renew_data.get('journal_entries')),
                    'has_posplan_responses': bool(renew_data.get('posplan_responses')),
                    'has_iron_sponge_results': bool(iron_sponge_data),
                    'iron_sponge_questions_answered': len(iron_sponge_data.get('responses', {}))
                },
                'qualtrics_data': comprehensive_data,  # Structured data
                'summary_html': summary_html  # HTML summary for display
            })
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Invalid method'}, status=405)
    
def qualtrics_survey_view(request):
    """Display embedded Qualtrics survey"""
    return render(request, 'accounts/qualtrics_survey.html')
    
def completion_video(request):
    return render(request, 'accounts/completion_video.html')