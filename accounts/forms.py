from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.models import User

class SignUpForm(UserCreationForm):
    """Simplified signup form for SQL database"""
    name = forms.CharField(
        max_length=100,
        widget=forms.TextInput(attrs={
            'placeholder': 'Full Name',
            'class': 'form-input'
        })
    )
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={
            'placeholder': 'Email',
            'class': 'form-input'
        })
    )
    password1 = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'placeholder': 'Password',
            'class': 'form-input'
        })
    )
    password2 = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'placeholder': 'Confirm Password',
            'class': 'form-input'
        })
    )
    
    class Meta:
        model = User
        fields = ('name', 'email', 'password1', 'password2')
    
    def clean_email(self):
        """Check if email already exists"""
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError("Email already exists.")
        return email
    
    def save(self, commit=True):
        """Save user to database"""
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        user.last_name = self.cleaned_data['name']  # Store full name in last_name
        user.username = self.cleaned_data['email']  # Use email as username
        
        if commit:
            user.save()
        return user

class LoginForm(AuthenticationForm):
    """Custom login form with styling"""
    username = forms.EmailField(
        widget=forms.EmailInput(attrs={
            'placeholder': 'Email',
            'class': 'form-input'
        })
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'placeholder': 'Password',
            'class': 'form-input'
        })
    )

class NicknameForm(forms.Form):
    """Form for setting user nickname"""
    nickname = forms.CharField(
        max_length=100,
        widget=forms.TextInput(attrs={
            'placeholder': 'Enter your nickname',
            'class': 'form-input'
        })
    )

class NoteForm(forms.Form):
    """Form for section notes"""
    content = forms.CharField(
        widget=forms.Textarea(attrs={
            'placeholder': 'Write your notes here...',
            'class': 'form-input',
            'rows': 6
        })
    )