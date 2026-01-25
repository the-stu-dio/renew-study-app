# study_project/urls.py
from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect
from django.conf import settings
from django.conf.urls.static import static

def home_redirect(request):
    # Since we're using localStorage, we can't check user data server-side
    # Just redirect to the landing page and let JavaScript handle the flow
    return redirect('/accounts/')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home_redirect),
    path('accounts/', include('accounts.urls')),
]

# Serve static files during development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)