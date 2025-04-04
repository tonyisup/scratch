import requests
from bs4 import BeautifulSoup
import time
import csv

def scrape_instagram_comments(post_url, output_csv):
    """
    Scrapes comments and usernames from an Instagram post and saves them to a CSV file.

    Args:
        post_url (str): The URL of the Instagram post.
        output_csv (str): The filename for the output CSV file.
    """
    try:
        # Add headers to mimic a browser
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
        }
        response = requests.get(post_url, headers=headers)
        response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)

        with open("response.txt", "w", encoding="utf-8") as file:
            file.write(response.text)
            
        soup = BeautifulSoup(response.content, "html.parser")

        comments_data = []

        # Instagram's HTML structure is complex and can change.
        # You'll need to inspect the page source to find the correct selectors.
        # This is a general example, and you might need to adjust the selectors.

        comment_elements = soup.find_all("div", class_="_a9zs")  #  Inspect the page
        #  Inspect the page source to find the correct class name for the comment container
        for comment_element in comment_elements:
            try:
                username_element = comment_element.find("a", class_="_a9za")  #  Inspect the page source to find the correct class name for the username
                comment_text_element = comment_element.find("span") # Inspect the page source to find the element containing the comment text

                if username_element and comment_text_element:
                    username = username_element.text.strip()
                    comment_text = comment_text_element.text.strip()
                    comments_data.append({"username": username, "comment": comment_text})

            except Exception as e:
                print(f"Error extracting comment: {e}")

        # Write the data to a CSV file
        with open(output_csv, "w", newline="", encoding="utf-8") as csvfile:
            fieldnames = ["username", "comment"]
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

            writer.writeheader()
            writer.writerows(comments_data)

        print(f"Successfully scraped {len(comments_data)} comments and saved to {output_csv}")

    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    post_url = "https://www.instagram.com/p/DH_ictVxzcK/"  # Replace with the actual URL
    output_csv = "comments.csv"  # The name of the output CSV file

    scrape_instagram_comments(post_url, output_csv)
