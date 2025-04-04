# Google Sheets Comments Updater

This started as a brilliant instagram post by the_intuition_dietitian requesting unhinged ADHD hacks
Many suggested create a shared doc, but the number of comments became a bit much. 
This is my attempt.

This script updates a Google Sheet with data from a JSON file containing comments.

Currently I'm manually pulling the data through the developer panel, but I'd like to
learn the selenium driver to try and automate it.

## Prerequisites

- Python 3.6 or higher
- A Google account
- Google Sheets API enabled in your Google Cloud project
- OAuth 2.0 credentials for the Google Sheets API

## Setup Instructions

1. **Install dependencies**:
   ```
   pip install -r requirements.txt
   ```

2. **Set up Google Sheets API**:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google Sheets API for your project
   - Create OAuth 2.0 credentials (Desktop application)
   - Download the credentials and save them as `credentials.json` in the same directory as the script

3. **Create a Google Sheet**:
   - Create a new Google Sheet
   - Copy the Sheet ID from the URL (the long string between `/d/` and `/edit` in the URL)
   - Update the `spreadsheet_id` variable in the script with your Sheet ID
   - **IMPORTANT**: Share the Google Sheet with the Google account you'll use to run the script
     - Click the 'Share' button in the top right
     - Add your Google account email and give it 'Editor' access
     - Click 'Share'

4. **Run the script**:
   ```
   python update_google_sheet.py
   ```
   - The first time you run the script, it will open a browser window asking you to authorize the application
   - After authorization, a `token.json` file will be created to store your credentials

## Data Format

The script expects a JSON file with the following structure:
```json
[
  {
    "username": "username1",
    "comment": "comment text",
    "timestamp": "2025-04-03T17:27:48.000Z",
    "likes": "0",
    "verified": true
  },
  ...
]
```

## Troubleshooting

- If you get authentication errors, delete the `token.json` file and run the script again
- If you get a "The caller does not have permission" error:
  - Make sure the Google Sheet is shared with the Google account you're using
  - Verify that the spreadsheet ID is correct
  - Ensure you have the necessary permissions to edit the sheet
- Check that the Google Sheets API is enabled in your Google Cloud project 