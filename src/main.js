import { Actor } from 'apify';
import { CheerioCrawler, log } from 'crawlee';

await Actor.init();

try {
    const input = await Actor.getInput();
    if (!input || !input.channelUrls || input.channelUrls.length === 0) {
        throw new Error('channelUrls input is required!');
    }

    // Force all URLs to point to the /about tab so we ensure the links metadata is loaded
    const normalizedUrls = input.channelUrls.map(u => {
        let urlStr = u.url || u;
        if (!urlStr.endsWith('/about')) {
            // Remove trailing slash if exists
            if (urlStr.endsWith('/')) urlStr = urlStr.slice(0, -1);
            urlStr = `${urlStr}/about`;
        }
        return urlStr;
    });

    let processedCount = 0;

    const crawler = new CheerioCrawler({
        maxConcurrency: 10,
        
        async requestHandler({ request, $, log }) {
            const originalUrl = request.url.replace(/\/about$/, '');
            
            // Find the script tag containing ytInitialData
            const scripts = $('script').toArray();
            let initialDataStr = null;

            for (const script of scripts) {
                const content = $(script).html() || '';
                if (content.includes('var ytInitialData = ')) {
                    const match = content.match(/var ytInitialData = (\{.*?\});/);
                    if (match && match[1]) {
                        initialDataStr = match[1];
                        break;
                    }
                }
            }

            if (!initialDataStr) {
                log.warning(`Could not find ytInitialData on ${originalUrl}`);
                return;
            }

            let initialData;
            try {
                initialData = JSON.parse(initialDataStr);
            } catch (e) {
                log.error(`Failed to parse ytInitialData JSON for ${originalUrl}`);
                return;
            }

            // Extract metadata from the complex YouTube JSON structure
            let title = null;
            let description = null;
            let subscriberCount = null;
            let website = null;
            const socialLinks = [];

            try {
                // Header metadata
                const header = initialData.header?.c4TabbedHeaderRenderer || initialData.header?.pageHeaderRenderer;
                if (header) {
                    title = header.title || header.pageTitle;
                    
                    // Old header format
                    if (header.subscriberCountText?.simpleText) {
                        subscriberCount = header.subscriberCountText.simpleText;
                    } 
                    // New header format (pageHeaderRenderer)
                    else if (header.content?.pageHeaderViewModel?.metadata?.contentMetadataViewModel?.metadataRows) {
                        const rows = header.content.pageHeaderViewModel.metadata.contentMetadataViewModel.metadataRows;
                        for (const row of rows) {
                            const parts = row.metadataParts;
                            if (parts) {
                                for (const part of parts) {
                                    if (part.text?.content?.includes('subscribers')) {
                                        subscriberCount = part.text.content;
                                    }
                                }
                            }
                        }
                    }
                }

                // Metadata Renderer (Description and exact title)
                const metadata = initialData.metadata?.channelMetadataRenderer;
                if (metadata) {
                    if (!title) title = metadata.title;
                    description = metadata.description;
                }

                // Extract external links
                // Links are often stored in the header view model in newer YouTube UI
                const headerLinks = initialData.header?.pageHeaderRenderer?.content?.pageHeaderViewModel?.links?.channelHeaderLinksViewModel?.firstLink?.content;
                const headerLinksList = initialData.header?.pageHeaderRenderer?.content?.pageHeaderViewModel?.links?.channelHeaderLinksViewModel?.links;
                
                const allLinksData = [];
                if (headerLinks) allLinksData.push(headerLinks);
                if (headerLinksList) {
                    headerLinksList.forEach(l => {
                        if (l.channelHeaderLinksItemViewModel?.title?.content) {
                            // Extract URL from redirect or direct
                            let linkUrl = l.channelHeaderLinksItemViewModel.title.content; 
                            
                            // If YouTube wraps the URL in a redirect
                            const command = l.channelHeaderLinksItemViewModel.command?.urlEndpoint?.url;
                            if (command && command.includes('q=')) {
                                try {
                                    const parsed = new URL(command, 'https://youtube.com');
                                    const actualUrl = parsed.searchParams.get('q');
                                    if (actualUrl) linkUrl = actualUrl;
                                } catch (e) {}
                            } else if (command) {
                                linkUrl = command;
                            }
                            
                            allLinksData.push(linkUrl);
                        }
                    });
                }
                
                // Process extracted links
                for (let link of allLinksData) {
                    if (link.startsWith('http')) {
                        // Is it a website or social link?
                        const lowerLink = link.toLowerCase();
                        if (lowerLink.includes('instagram.com') || 
                            lowerLink.includes('twitter.com') || 
                            lowerLink.includes('x.com') || 
                            lowerLink.includes('facebook.com') || 
                            lowerLink.includes('tiktok.com') ||
                            lowerLink.includes('twitch.tv')) {
                            socialLinks.push(link);
                        } else {
                            if (!website) website = link;
                            else socialLinks.push(link); // Put additional websites in socialLinks
                        }
                    }
                }

            } catch (e) {
                log.warning(`Error traversing JSON for ${originalUrl}: ${e.message}`);
            }

            // Push to dataset
            await Actor.pushData({
                channelUrl: originalUrl,
                title: title || 'Unknown',
                description: description || '',
                subscriberCount,
                website,
                socialLinks,
                scrapedAt: new Date().toISOString()
            });

            // Charge PPE
            await Actor.charge({ eventName: 'channel-processed', count: 1 });
            processedCount++;
            
            log.info(`✅ Processed ${originalUrl} - Found ${socialLinks.length + (website ? 1 : 0)} external links.`);
        },
        
        async failedRequestHandler({ request, log }) {
            log.error(`Request ${request.url} failed too many times.`);
        },
    });

    log.info(`Starting YouTube crawler for ${normalizedUrls.length} channels...`);
    
    await crawler.addRequests(normalizedUrls);
    await crawler.run();

    log.info(`🎉 Finished! Processed ${processedCount} channels successfully.`);
} catch (error) {
    log.error('Actor failed:', error);
    throw error;
}

await Actor.exit();
