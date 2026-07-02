# YouTube Channel Website Finder

**Instantly extract the primary website and social media links from any YouTube channel. Essential for lead generation, influencer outreach, and B2B prospecting.**

Extracting contact details from YouTube channels manually is incredibly tedious because YouTube hides external links deep inside dynamic JavaScript objects, requiring users to manually click through the "About" tab. 

This actor automates the entire process. Just feed it a list of YouTube channel URLs, and it uses a high-speed static scraper to parse YouTube's hidden metadata layer (`ytInitialData`), instantly revealing all the external links the channel owner has configured.

## What can this Actor do?

- ✅ **Website Extraction** - Finds the primary website linked to the channel.
- ✅ **Social Media Discovery** - Extracts all external social media links (Instagram, Twitter, Facebook, TikTok, etc.).
- ✅ **Metadata Parsing** - Grabs the channel's title, description/bio, and subscriber count.
- ✅ **Blazing Fast** - Built on Cheerio (static HTML scraping). It bypasses the need for a heavy, slow headless browser by extracting data directly from YouTube's initial state JSON.

## Why use this Actor?

- 🎯 **Lead Generation** - Build databases of business websites from a list of niche YouTube channels.
- 🤝 **Influencer Outreach** - Find the Instagram or business websites of influencers to reach out for sponsorships.
- 📊 **Market Research** - Analyze how competitors link out to their products from their YouTube channels.

## How to use it

1. Enter a list of YouTube channel URLs into the **YouTube Channel URLs** field.
   - *(e.g., `https://www.youtube.com/@mkbhd`, `https://www.youtube.com/c/PewDiePie`)*
2. Click Start!

## How much does it cost?

This actor uses a **Pay-Per-Event (PPE)** pricing model. You only pay for the channels successfully processed!
- **$1.00 per 1,000 channels processed.**

## Output Example

When a channel is successfully processed, the actor pushes this data to your dataset:

```json
{
  "channelUrl": "https://www.youtube.com/@mkbhd",
  "title": "Marques Brownlee",
  "description": "MKBHD: Quality Tech Videos | YouTuber | Geek | Consumer Electronics | Tech Head | Internet Personality!",
  "subscriberCount": "18.3M subscribers",
  "website": "https://mkbhd.com/",
  "socialLinks": [
    "https://twitter.com/MKBHD",
    "https://www.instagram.com/mkbhd",
    "https://discord.gg/mac"
  ],
  "scrapedAt": "2023-10-25T15:00:00.000Z"
}
```
