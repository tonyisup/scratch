import json
import os
import pandas as pd
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import datetime

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

def get_google_sheets_service():
    """Gets Google Sheets service with proper authentication."""
    creds = None
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first time.
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    service = build('sheets', 'v4', credentials=creds)
    return service

def load_comments_data(file_path):
    """Load comments data from JSON file."""
    with open(file_path, 'r', encoding='utf-8') as file:
        data = json.load(file)
    return data

def format_comments_for_sheets(comments):
    """Format comments data for Google Sheets."""
    formatted_data = []
    
    # Add header row
    formatted_data.append(['Username', 'Comment', 'Timestamp', 'Likes', 'Verified'])
    
    for comment in comments:
        # Convert timestamp to readable format if it's a Unix timestamp
        timestamp = comment['timestamp']
        if isinstance(timestamp, int):
            dt = datetime.datetime.fromtimestamp(timestamp)
            timestamp = dt.strftime('%Y-%m-%d %H:%M:%S')
        elif isinstance(timestamp, str) and timestamp.startswith('2025'):
            # This is already in a readable format
            pass
        else:
            # Handle other timestamp formats if needed
            pass
            
        formatted_data.append([
            comment['username'],
            comment['comment'],
            timestamp,
            comment['likes'],
            comment['verified']
        ])
    
    return formatted_data

def update_google_sheet(service, spreadsheet_id, range_name, values):
    """Update Google Sheet with the provided values."""
    body = {
        'values': values
    }
    
    try:
        result = service.spreadsheets().values().update(
            spreadsheetId=spreadsheet_id,
            range=range_name,
            valueInputOption='RAW',
            body=body
        ).execute()
        
        print(f"{result.get('updatedCells')} cells updated.")
        return result
    except HttpError as error:
        if error.resp.status == 403:
            print("\nERROR: Permission denied. Please check the following:")
            print("1. Make sure the Google Sheet is shared with the Google account you're using")
            print("2. Verify that the spreadsheet ID is correct")
            print("3. Ensure you have the necessary permissions to edit the sheet")
            print("\nTo share the sheet with your account:")
            print("1. Open the Google Sheet in your browser")
            print("2. Click the 'Share' button in the top right")
            print("3. Add your Google account email and give it 'Editor' access")
            print("4. Click 'Share'")
        else:
            print(f"An error occurred: {error}")
        return None

def main():
    # Path to your JSON file
    json_file_path = 'comments-all.json'
    
    # Your Google Sheet ID (you'll need to replace this with your actual sheet ID)
    # You can find this in the URL of your Google Sheet: https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit
    spreadsheet_id = '1UeFHCMwy1H_a4ZXQ2w8cKz_cioKvI9IZkU7aw8-Dgzg'
    
    # The range to update (e.g., 'Sheet1!A1')
    range_name = 'Sheet1!A1'
    
    # Load comments data
    comments_data = load_comments_data(json_file_path)
    
    # Format data for Google Sheets
    formatted_data = format_comments_for_sheets(comments_data)
    
    # Get Google Sheets service
    service = get_google_sheets_service()
    
    # Update Google Sheet
    result = update_google_sheet(service, spreadsheet_id, range_name, formatted_data)
    
    if result:
        print("Google Sheet updated successfully!")
    else:
        print("Failed to update Google Sheet. Please fix the errors and try again.")

if __name__ == '__main__':
    main() 