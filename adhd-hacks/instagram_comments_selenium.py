import json
import math
import random
import time
import csv
import os
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager

def setup_driver():
    """Set up and return a Chrome WebDriver with DevTools Protocol enabled."""
    chrome_options = Options()
    # Uncomment the line below if you want to run in headless mode
    # chrome_options.add_argument("--headless")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--disable-notifications")
    chrome_options.add_argument("--disable-popup-blocking")
    
    # Enable DevTools Protocol
    chrome_options.set_capability("goog:loggingPrefs", {"performance": "ALL"})
    
    # Initialize the driver
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
    return driver

def extract_comments_from_xhr(driver, logs):
    """Extract comments from XHR response logs."""
    comments_data = []
    
    for entry in logs:
        try:
            log = json.loads(entry["message"])["message"]
            
            # Check if this is a network response
            if "Network.responseReceived" in log["method"]:
                request_id = log["params"]["requestId"]
                
                # Check if the response is JSON
                if "application/json" in log["params"]["response"].get("mimeType", ""):
                    # Get the response body
                    response_body = driver.execute_cdp_cmd("Network.getResponseBody", {"requestId": request_id})
                    
                    if "body" in response_body:
                        try:
                            json_data = json.loads(response_body["body"])
                            
                            # Process the JSON data to extract comments
                            # This structure may need adjustment based on Instagram's actual response format
                            if "data" in json_data and "shortcode_media" in json_data["data"]:
                                media = json_data["data"]["shortcode_media"]
                                if "edge_media_to_parent_comment" in media:
                                    edges = media["edge_media_to_parent_comment"]["edges"]
                                    for edge in edges:
                                        node = edge["node"]
                                        username = node["owner"]["username"]
                                        comment_text = node["text"]
                                        timestamp = node.get("created_at", "")
                                        likes_count = node.get("comment_like_count", "0")
                                        verified = node.get("owner", {}).get("is_verified", False)
                                        
                                        comments_data.append({
                                            "username": username, 
                                            "comment": comment_text,
                                            "timestamp": timestamp,
                                            "likes": likes_count,
                                            "verified": verified
                                        })
                        except json.JSONDecodeError:
                            pass
        except Exception as e:
            print(f"Error processing log entry: {e}")
    
    return comments_data

def load_existing_comments(json_file):
    """Load existing comments from the JSON file if it exists."""
    if os.path.exists(json_file):
        try:
            with open(json_file, 'r', encoding='utf-8') as file:
                return json.load(file)
        except json.JSONDecodeError:
            print(f"Error reading {json_file}. Starting with an empty list.")
            return []
    else:
        return []

def save_comments_to_json(comments, json_file):
    """Save comments to the JSON file."""
    with open(json_file, 'w', encoding='utf-8') as file:
        json.dump(comments, file, indent=2, ensure_ascii=False)
    
    print(f"Comments saved to {json_file}")

def scrape_instagram_comments(post_url, json_file, max_scrolls=10):
    """
    Scrapes comments from an Instagram post using Selenium and appends them to the JSON file.
    
    Args:
        post_url (str): The URL of the Instagram post.
        json_file (str): The filename for the JSON file.
        max_scrolls (int): Maximum number of times to scroll down to load more comments.
    """
    driver = setup_driver()
    all_comments = load_existing_comments(json_file)
    existing_usernames = {comment["username"] for comment in all_comments}
    new_comments_count = 0
    
    try:
        # Navigate to the Instagram post
        driver.get(post_url)
        print(f"Navigating to {post_url}")
        
        # Wait for the page to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        
        # Give the page some time to fully load
        time.sleep(math.floor(random.uniform(5, 10)))
        
        # Scroll down to load more comments
        for i in range(max_scrolls):
            print(f"Scroll {i+1}/{max_scrolls}")
            
            # Get the current performance logs
            logs = driver.get_log("performance")
            
            # Extract comments from the current logs
            comments = extract_comments_from_xhr(driver, logs)
            
            # Filter out comments we already have
            new_comments = [comment for comment in comments if comment["username"] not in existing_usernames]
            
            if new_comments:
                all_comments.extend(new_comments)
                new_comments_count += len(new_comments)
                # Update the set of existing usernames
                existing_usernames.update(comment["username"] for comment in new_comments)
                print(f"Found {len(new_comments)} new comments. Total: {len(all_comments)}")
            
            # Scroll down to load more comments
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            
            # Wait for new content to load
            time.sleep(math.floor(random.uniform(3, 20)))
            
            # Check if we've reached the end of the comments
            try:
                # Look for a "Load more comments" button or similar indicator
                load_more = driver.find_element(By.XPATH, "//button[contains(text(), 'Load more comments')]")
                load_more.click()
                time.sleep(2)
            except NoSuchElementException:
                # If we can't find the load more button, we might have reached the end
                pass
        
        # Save the updated comments to the JSON file
        save_comments_to_json(all_comments, json_file)
        
        print(f"Successfully added {new_comments_count} new comments to {json_file}")
        print(f"Total comments in file: {len(all_comments)}")
        
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    post_url = "https://www.instagram.com/p/DH_ictVxzcK/"  # Replace with the actual URL
    json_file = "comments-selenium.json"  # The name of the JSON file
    
    scrape_instagram_comments(post_url, json_file) 