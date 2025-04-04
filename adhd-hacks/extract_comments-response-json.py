import json
import os

def extract_comments(json_file):
    """
    Extract comments from a JSON file and return them as a list of dictionaries.
    Each dictionary contains the username and comment text.
    """
    with open(json_file, 'r', encoding='utf-8', errors='ignore') as file:
        data = json.load(file)
    
    comments = []
    
    # Process each comment node in the JSON data
    for item in data:
        if 'node' in item:
            node = item['node']
            if 'user' in node and 'text' in node:
                username = node['user'].get('username', 'Unknown User')
                comment_text = node['text']
                
                # Extract additional metadata if available
                timestamp = node.get('created_at', '')
                likes_count = node.get('comment_like_count', '0')
                verified = node.get('user', {}).get('is_verified', False)
                
                comments.append({
                    "username": username,
                    "comment": comment_text,
                    "timestamp": timestamp,
                    "likes": likes_count,
                    "verified": verified
                })
    
    return comments

def save_to_json(comments, output_file):
    """Save the extracted comments to a JSON file."""
    with open(output_file, 'w', encoding='utf-8') as file:
        json.dump(comments, file, indent=2, ensure_ascii=False)
    
    print(f"Comments saved to {output_file}")

def main():
    # Input and output file paths
    json_file = "comment-response.json"
    output_file = "comments.json"
    
    # Extract comments
    comments = extract_comments(json_file)
    
    # Save to JSON
    save_to_json(comments, output_file)
    
    # Print summary
    print(f"Extracted {len(comments)} comments")

if __name__ == "__main__":
    main() 