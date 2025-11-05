# Metadata Extraction & Wishlist Parsing Research

## Executive Summary

This research document provides comprehensive analysis of technologies, APIs, and libraries for extracting metadata from URLs and parsing wishlist links from major e-commerce platforms. The findings cover Open Graph Protocol implementation, Node.js metadata extraction libraries, retailer-specific APIs, image proxying services, and CORS challenges with their solutions.

---

## 1. Open Graph Protocol (OG)

### Overview
The Open Graph Protocol embeds structured metadata in HTML `<head>` tags, enabling social media platforms and applications to extract rich preview information from URLs. It remains the industry standard in 2025 for controlling how links are rendered across platforms.

### Core Required Properties

```html
<!-- Required OG tags -->
<meta property="og:title" content="Product Name" />
<meta property="og:type" content="product" />
<meta property="og:image" content="https://example.com/image.jpg" />
<meta property="og:url" content="https://example.com/product" />
```

### Extended Product Properties

```html
<!-- Optional but recommended for e-commerce -->
<meta property="og:description" content="Product description" />
<meta property="og:site_name" content="Store Name" />
<meta property="og:locale" content="en_US" />

<!-- Image properties -->
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Product image description" />
<meta property="og:image:type" content="image/jpeg" />

<!-- Product-specific -->
<meta property="product:price:amount" content="29.99" />
<meta property="product:price:currency" content="USD" />
```

### Best Practices for 2025

| Property | Recommendation | Notes |
|----------|---------------|-------|
| `og:title` | 60-75 characters | Optimal for readability across platforms |
| `og:description` | Under 200 characters | Prevents truncation on social media |
| `og:image` | 1200x630px | Standard aspect ratio, platforms may crop larger |
| `og:image:alt` | Required when using `og:image` | Accessibility and SEO |

### Implementation Example

```javascript
// Client-side extraction (using DOMParser)
function extractOGMetadata(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const ogTags = doc.querySelectorAll('meta[property^="og:"]');

  const metadata = {};
  ogTags.forEach(tag => {
    const property = tag.getAttribute('property');
    const content = tag.getAttribute('content');
    metadata[property] = content;
  });

  return metadata;
}
```

---

## 2. Node.js Metadata Extraction Libraries

### Comparative Analysis

#### Download Statistics (Weekly, 2025)
- **open-graph-scraper**: 63,081-66,744 downloads
- **metascraper**: 40,348-54,113 downloads
- **unfurl.js**: 8,554 downloads

#### GitHub Popularity
- **metascraper**: 2,430-2,460 stars ⭐
- **open-graph-scraper**: 696-707 stars
- **unfurl.js**: 491 stars

### Library Deep Dive

---

#### A. Metascraper (Recommended for Accuracy)

**Pros:**
- ✅ Most comprehensive metadata extraction
- ✅ Multiple fallback strategies (OG, JSON-LD, HTML meta, microdata)
- ✅ Highly extensible plugin architecture
- ✅ Active maintenance (v5.49.5, updated 6 days ago)
- ✅ High accuracy for articles and product pages
- ✅ Not restricted to CSS selectors

**Cons:**
- ❌ Larger bundle size due to plugins
- ❌ Requires more configuration for basic use
- ❌ Higher learning curve

**Installation:**
```bash
npm install metascraper metascraper-title metascraper-description metascraper-image metascraper-url
```

**Implementation Example:**
```javascript
const metascraper = require('metascraper')([
  require('metascraper-title')(),
  require('metascraper-description')(),
  require('metascraper-image')(),
  require('metascraper-url')(),
  require('metascraper-author')(),
  require('metascraper-date')(),
  require('metascraper-logo')(),
  require('metascraper-publisher')()
]);

async function extractMetadata(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const metadata = await metascraper({ html, url });

    return {
      title: metadata.title,
      description: metadata.description,
      image: metadata.image,
      url: metadata.url,
      author: metadata.author,
      date: metadata.date,
      logo: metadata.logo,
      publisher: metadata.publisher
    };
  } catch (error) {
    console.error('Metadata extraction failed:', error);
    throw error;
  }
}

// Usage
const data = await extractMetadata('https://example.com/product');
console.log(data);
// {
//   title: "Product Name",
//   description: "Product description",
//   image: "https://example.com/product-image.jpg",
//   url: "https://example.com/product",
//   ...
// }
```

**Custom Rule Example:**
```javascript
// Create custom rules for e-commerce products
const priceRule = () => ({
  price: [
    // Try structured data first
    ({ htmlDom }) => htmlDom('meta[property="product:price:amount"]').attr('content'),
    // Fallback to common selectors
    ({ htmlDom }) => htmlDom('.price').text().trim(),
    ({ htmlDom }) => htmlDom('[itemprop="price"]').attr('content')
  ]
});

const metascraperWithPrice = metascraper([
  ...standardRules,
  priceRule()
]);
```

---

#### B. open-graph-scraper (Recommended for Simplicity)

**Pros:**
- ✅ Most downloads (highest adoption)
- ✅ Simple API, minimal configuration
- ✅ TypeScript declarations included
- ✅ Focused specifically on OG and Twitter Card extraction
- ✅ Fast and lightweight
- ✅ Good for basic use cases

**Cons:**
- ❌ Limited to OG and Twitter Card metadata
- ❌ Fewer fallback strategies
- ❌ Less extensible than metascraper

**Installation:**
```bash
npm install open-graph-scraper
```

**Implementation Example:**
```javascript
const ogs = require('open-graph-scraper');

async function getOGData(url) {
  try {
    const { result } = await ogs({ url });

    return {
      title: result.ogTitle,
      description: result.ogDescription,
      image: result.ogImage?.[0]?.url || result.ogImage?.url,
      imageWidth: result.ogImage?.[0]?.width,
      imageHeight: result.ogImage?.[0]?.height,
      imageType: result.ogImage?.[0]?.type,
      url: result.ogUrl,
      siteName: result.ogSiteName,
      type: result.ogType,
      // Twitter Card fallbacks
      twitterCard: result.twitterCard,
      twitterTitle: result.twitterTitle,
      twitterImage: result.twitterImage?.[0]?.url
    };
  } catch (error) {
    console.error('OG scraping failed:', error);
    throw error;
  }
}

// Usage with options
const data = await getOGData('https://example.com/product');

// Advanced options
const { result } = await ogs({
  url: 'https://example.com/product',
  timeout: 5000,
  fetchOptions: {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; MyBot/1.0)'
    }
  },
  onlyGetOpenGraphInfo: false, // Get Twitter Card too
  customMetaTags: [{
    multiple: false,
    property: 'product:price:amount',
    fieldName: 'price'
  }]
});
```

---

#### C. unfurl.js (Recommended for Rich Embeds)

**Pros:**
- ✅ Supports oEmbed, OG, Twitter Card, and more
- ✅ Best for creating Slack/Discord-style previews
- ✅ Returns formatted, sane data structure
- ✅ Handles video embeds well
- ✅ Good documentation

**Cons:**
- ❌ Lower adoption than competitors
- ❌ Less frequent updates
- ❌ Slightly slower due to comprehensive checks

**Installation:**
```bash
npm install unfurl.js
```

**Implementation Example:**
```javascript
const unfurl = require('unfurl.js').unfurl;

async function getUnfurledData(url) {
  try {
    const metadata = await unfurl(url, {
      oembed: true,
      timeout: 5000
    });

    return {
      // Core metadata
      title: metadata.title,
      description: metadata.description,
      favicon: metadata.favicon,

      // Open Graph
      oEmbed: metadata.oEmbed,
      open_graph: metadata.open_graph,
      twitter_card: metadata.twitter_card,

      // Media
      videos: metadata.videos,
      images: metadata.images,

      // Additional
      other: metadata.other
    };
  } catch (error) {
    console.error('Unfurl failed:', error);
    throw error;
  }
}

// Usage
const data = await getUnfurledData('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
console.log(data);
// {
//   title: "Video Title",
//   oEmbed: {
//     type: "video",
//     html: "<iframe ...>",
//     thumbnail_url: "...",
//     ...
//   }
// }
```

---

### Recommendation Matrix

| Use Case | Recommended Library | Reason |
|----------|-------------------|--------|
| **E-commerce products** | metascraper | Best fallback strategies, custom rules |
| **Simple OG extraction** | open-graph-scraper | Fast, simple, most popular |
| **Rich embeds (videos, etc.)** | unfurl.js | oEmbed support, media handling |
| **High accuracy required** | metascraper | Multiple extraction strategies |
| **TypeScript project** | open-graph-scraper | Built-in TypeScript declarations |
| **Social media previews** | unfurl.js | Formats data like Slack/Discord |

---

## 3. Retailer-Specific APIs

### Critical Finding: No Official Wishlist APIs

**Key Insight**: As of 2025, **no major retailer** (Amazon, Target, Walmart, Etsy) provides official public APIs for wishlist access. All wishlist data extraction requires web scraping.

---

### A. Amazon Product Advertising API

**Status**: ❌ **No wishlist support**

**Key Facts:**
- Official API shut down wishlist access several years ago
- Current API only supports product catalog data (details, images, reviews, pricing)
- **Barrier to entry**: Must make 3 sales within 180 days to maintain API access
- Rate limit: 1 request per second
- **Free of charge** but strict usage requirements

**Amazon Product Advertising API Capabilities:**
```javascript
// Example: What you CAN do with Amazon PA API
const amazonPAAPI = require('amazon-pa-api51');

const api = new amazonPAAPI({
  accessKey: process.env.AMAZON_ACCESS_KEY,
  secretKey: process.env.AMAZON_SECRET_KEY,
  partnerTag: process.env.AMAZON_PARTNER_TAG,
  region: 'US'
});

// Get product details by ASIN
async function getProductDetails(asin) {
  try {
    const response = await api.getItems({
      itemIds: [asin],
      resources: [
        'Images.Primary.Large',
        'ItemInfo.Title',
        'ItemInfo.Features',
        'Offers.Listings.Price'
      ]
    });

    return response.ItemsResult.Items[0];
  } catch (error) {
    console.error('Amazon PA API error:', error);
  }
}

// Note: This CANNOT access wishlist data!
```

**Alternative Solution for Amazon Wishlists:**

```javascript
// Unofficial wishlist scraping (GitHub: amazon-wishlist-webservice)
// This requires web scraping, not official API

const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeAmazonWishlist(wishlistId) {
  try {
    const url = `https://www.amazon.com/hz/wishlist/ls/${wishlistId}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const items = [];

    $('[data-itemid]').each((i, elem) => {
      const item = {
        asin: $(elem).attr('data-itemid'),
        title: $(elem).find('h3 a').text().trim(),
        price: $(elem).find('.a-price .a-offscreen').text().trim(),
        image: $(elem).find('img').attr('src'),
        link: 'https://www.amazon.com' + $(elem).find('h3 a').attr('href')
      };
      items.push(item);
    });

    return items;
  } catch (error) {
    console.error('Wishlist scraping failed:', error);
    throw error;
  }
}
```

**Challenges:**
- ⚠️ Amazon frequently changes HTML structure
- ⚠️ Rate limiting and IP blocking
- ⚠️ Requires handling of pagination
- ⚠️ May violate Amazon's Terms of Service

---

### B. Target, Walmart, Etsy APIs

**Status**: ❌ **No official wishlist APIs**

**Available Solutions:**

#### Third-Party Scraper APIs (Paid Services)

1. **Oxylabs** - Target & Walmart scrapers
   - API-based scraping with proxy rotation
   - Handles anti-bot measures
   - Pricing: Enterprise-level

2. **ScraperAPI** - Multi-platform e-commerce scraper
   - Supports Walmart, Target, and more
   - Automatic CAPTCHA solving
   - Pricing: Pay-per-request

3. **ScrapingBee** - Walmart-specific scraper API
   - Headless browser rendering
   - JavaScript execution support
   - Pricing: Credit-based

**Example: Using ScraperAPI for Walmart**

```javascript
const axios = require('axios');

async function scrapeWalmartProduct(productUrl) {
  const apiKey = process.env.SCRAPERAPI_KEY;
  const targetUrl = encodeURIComponent(productUrl);

  try {
    const response = await axios.get(
      `http://api.scraperapi.com?api_key=${apiKey}&url=${targetUrl}&render=true`
    );

    // Parse the HTML response
    const $ = cheerio.load(response.data);

    return {
      title: $('h1[itemprop="name"]').text().trim(),
      price: $('span[itemprop="price"]').attr('content'),
      image: $('img[data-testid="hero-image"]').attr('src'),
      description: $('div[itemprop="description"]').text().trim()
    };
  } catch (error) {
    console.error('Scraping failed:', error);
    throw error;
  }
}
```

#### DIY Scraping Approach

**Legal Considerations:**
- ✅ Publicly available data can be scraped
- ❌ Do NOT scrape non-public data (private wishlists)
- ❌ Do NOT store PII of EU citizens (GDPR compliance)
- ⚠️ Respect robots.txt and rate limits

**Example: Target Product Scraper**

```javascript
const puppeteer = require('puppeteer');

async function scrapeTargetProduct(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Set realistic user agent
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  );

  try {
    await page.goto(url, { waitUntil: 'networkidle2' });

    const productData = await page.evaluate(() => {
      return {
        title: document.querySelector('h1[data-test="product-title"]')?.textContent.trim(),
        price: document.querySelector('[data-test="product-price"]')?.textContent.trim(),
        image: document.querySelector('[data-test="product-image"] img')?.src,
        description: document.querySelector('[data-test="item-details-description"]')?.textContent.trim()
      };
    });

    await browser.close();
    return productData;
  } catch (error) {
    await browser.close();
    throw error;
  }
}
```

---

### Summary: Retailer API Landscape 2025

| Retailer | Official API | Wishlist Support | Alternative Solution |
|----------|-------------|-----------------|---------------------|
| Amazon | ✅ Yes (PA API) | ❌ No | Web scraping (complex) |
| Target | ❌ No | ❌ No | ScraperAPI / DIY |
| Walmart | ❌ No | ❌ No | ScraperAPI / DIY |
| Etsy | ❌ No | ❌ No | ScraperAPI / DIY |

**Recommendation**: For production applications, use combination of:
1. **Metascraper** for URL metadata extraction (works with all retailers)
2. **Paid scraper APIs** (ScraperAPI, Oxylabs) for reliability
3. **Fallback to Open Graph** when product pages are well-structured

---

## 4. Image Proxying & CDN Services

### Comparison: Cloudinary vs. imgix

#### Feature Matrix

| Feature | Cloudinary | imgix | Recommendation |
|---------|-----------|-------|----------------|
| **Storage** | ✅ Integrated | ❌ No (BYO) | Cloudinary for simplicity |
| **CDN** | Fastly + Akamai + CloudFront | Fastly only | Cloudinary (multi-CDN) |
| **Performance** | Excellent (Enterprise: Best) | Excellent | Tie (Enterprise: Cloudinary) |
| **Pricing** | Credit-based | Fixed-quota | Depends on use case |
| **Bandwidth** | Limited by plan | Unlimited* | imgix (fair usage applies) |
| **API Complexity** | More features, complex | Simpler, focused | imgix for simplicity |
| **Optimization** | AI-powered, automatic | URL-based, manual | Cloudinary |
| **Video Support** | ✅ Excellent | ⚠️ Limited | Cloudinary |
| **Free Tier** | 25 credits/month | 1,000 origin images | Cloudinary (more generous) |

*imgix: Unlimited bandwidth with fair usage policy (100MB/month per origin image)

---

### A. Cloudinary (Recommended for Full-Featured Needs)

**Pros:**
- ✅ Integrated storage (no need for S3/GCS)
- ✅ Multiple CDN providers (Akamai, Fastly, CloudFront)
- ✅ AI-powered optimization
- ✅ Excellent video support
- ✅ Automatic format conversion (WebP, AVIF)
- ✅ On-the-fly transformations
- ✅ More generous free tier

**Cons:**
- ❌ Credit-based pricing can be confusing
- ❌ More complex API
- ❌ Vendor lock-in for storage

**Installation:**
```bash
npm install cloudinary
```

**Implementation Example:**

```javascript
const cloudinary = require('cloudinary').v2;

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload image from URL (useful for product images)
async function cacheProductImage(imageUrl, productId) {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      public_id: `products/${productId}`,
      folder: 'wishlist-items',
      overwrite: true,
      invalidate: true,
      // Optimization settings
      quality: 'auto:best',
      fetch_format: 'auto' // Automatically serve WebP/AVIF
    });

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload failed:', error);
    throw error;
  }
}

// Generate optimized image URL with transformations
function getOptimizedImageUrl(publicId, options = {}) {
  return cloudinary.url(publicId, {
    width: options.width || 400,
    height: options.height || 400,
    crop: options.crop || 'fill',
    gravity: options.gravity || 'auto',
    quality: options.quality || 'auto:best',
    fetch_format: 'auto',
    dpr: 'auto', // Automatic device pixel ratio
    secure: true,
    // Advanced features
    effect: options.effect, // e.g., 'sharpen', 'improve'
    background: options.background || 'auto:border' // Smart background
  });
}

// Usage
const cachedUrl = await cacheProductImage(
  'https://example.com/product-image.jpg',
  'product-12345'
);

const optimizedUrl = getOptimizedImageUrl('products/product-12345', {
  width: 800,
  height: 800,
  crop: 'thumb',
  gravity: 'face' // Focus on faces in image
});

console.log(optimizedUrl);
// https://res.cloudinary.com/demo/image/upload/w_800,h_800,c_thumb,g_face,q_auto:best,f_auto/products/product-12345
```

**Advanced Features:**

```javascript
// Batch upload multiple product images
async function batchCacheImages(products) {
  const uploadPromises = products.map(product =>
    cloudinary.uploader.upload(product.imageUrl, {
      public_id: `products/${product.id}`,
      folder: 'wishlist-items',
      tags: ['wishlist', product.retailer, product.category],
      context: {
        alt: product.title,
        caption: product.description
      }
    })
  );

  return await Promise.all(uploadPromises);
}

// Responsive image generation
function generateResponsiveImages(publicId) {
  const sizes = [
    { width: 320, name: 'mobile' },
    { width: 768, name: 'tablet' },
    { width: 1024, name: 'desktop' },
    { width: 1920, name: 'hd' }
  ];

  return sizes.map(size => ({
    size: size.name,
    url: cloudinary.url(publicId, {
      width: size.width,
      crop: 'scale',
      quality: 'auto:good',
      fetch_format: 'auto'
    })
  }));
}
```

**Pricing (2025):**
- Free: 25 credits/month (generous for small projects)
- Plus: $99/month (95 credits)
- Advanced: $249/month (235 credits)
- Enterprise: Custom pricing, multi-CDN

---

### B. imgix (Recommended for Existing Storage)

**Pros:**
- ✅ Unlimited bandwidth (with fair usage)
- ✅ Simpler API and pricing
- ✅ No vendor lock-in (use your own storage)
- ✅ Excellent URL-based transformations
- ✅ Lower latency for simple use cases

**Cons:**
- ❌ No integrated storage (requires S3/GCS)
- ❌ Single CDN (Fastly only)
- ❌ Limited video support
- ❌ Less automation than Cloudinary

**Installation:**
```bash
npm install @imgix/js-core
```

**Implementation Example:**

```javascript
const ImgixClient = require('@imgix/js-core');

const client = new ImgixClient({
  domain: 'your-source.imgix.net',
  secureURLToken: process.env.IMGIX_TOKEN // Optional for secure URLs
});

// Generate optimized image URL
function getImgixUrl(path, options = {}) {
  return client.buildURL(path, {
    w: options.width || 400,
    h: options.height || 400,
    fit: options.fit || 'crop',
    auto: 'format,compress', // Automatic format & compression
    q: options.quality || 75,
    dpr: options.dpr || 2, // Retina support
    // Advanced parameters
    crop: options.crop || 'faces,entropy',
    sharp: options.sharp || 10
  });
}

// Usage
const optimizedUrl = getImgixUrl('/products/product-12345.jpg', {
  width: 800,
  height: 800,
  fit: 'clip',
  quality: 80
});

console.log(optimizedUrl);
// https://your-source.imgix.net/products/product-12345.jpg?w=800&h=800&fit=clip&q=80&auto=format,compress&dpr=2
```

**Responsive Images with imgix:**

```javascript
// Generate srcset for responsive images
function generateSrcSet(path, options = {}) {
  const params = {
    auto: 'format,compress',
    fit: 'crop',
    crop: 'faces,entropy',
    ...options
  };

  return client.buildSrcSet(path, params, {
    widths: [320, 640, 768, 1024, 1366, 1600, 1920],
    widthTolerance: 0.08
  });
}

// HTML usage
const srcset = generateSrcSet('/products/product-12345.jpg', {
  h: 400,
  fit: 'crop'
});

console.log(`<img src="${client.buildURL('/products/product-12345.jpg', { w: 800, auto: 'format' })}"
     srcset="${srcset}"
     sizes="(max-width: 768px) 100vw, 50vw"
     alt="Product" />`);
```

**Pricing (2025):**
- Free: 1,000 origin images
- Starter: $59/month (5,000 origin images)
- Pro: $179/month (25,000 origin images)
- Enterprise: Custom pricing

---

### Alternative: ImageKit.io

**Why Consider:**
- Best optimization test results for JPEG (2025)
- Lower pricing than Cloudinary/imgix
- Integrated storage + CDN
- Real-time image resizing
- Free tier: 20GB bandwidth, 20GB storage

**Quick Example:**

```javascript
const ImageKit = require('imagekit');

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

// Upload from URL
const result = await imagekit.upload({
  file: 'https://example.com/product.jpg',
  fileName: 'product-12345.jpg',
  folder: '/products/'
});

// Generate URL
const url = imagekit.url({
  path: result.filePath,
  transformation: [{
    width: 800,
    height: 800,
    quality: 80
  }]
});
```

---

### Recommendation by Use Case

| Use Case | Recommended Service | Reason |
|----------|-------------------|--------|
| **New project, no storage** | Cloudinary | All-in-one, generous free tier |
| **Existing S3/GCS storage** | imgix | No vendor lock-in, unlimited bandwidth |
| **Budget-conscious** | ImageKit.io | Best value, good performance |
| **High traffic** | Cloudinary Enterprise | Multi-CDN for global reach |
| **Simple image optimization** | imgix | Easy URL-based transformations |
| **Video + images** | Cloudinary | Best video support |

---

## 5. CORS & Scraping Challenges

### Understanding the Problem

**CORS (Cross-Origin Resource Sharing)** is a browser security mechanism that prevents client-side JavaScript from making requests to different domains. This is a **critical blocker** for client-side metadata extraction.

**Key Insight**: CORS is ONLY enforced by browsers, not by server-side code (Node.js, Python, etc.)

---

### Client-Side vs. Server-Side Approaches

#### Comparison Matrix

| Aspect | Client-Side | Server-Side |
|--------|-------------|-------------|
| **CORS Issue** | ❌ Major problem | ✅ No CORS restrictions |
| **Performance** | ⚠️ Limited by browser | ✅ Better for bulk operations |
| **Privacy** | ✅ User's IP used | ⚠️ Server IP may be blocked |
| **Latency** | ⚠️ User's connection | ✅ Fast server connection |
| **Scaling** | ✅ Distributed (users) | ⚠️ Centralized (server) |
| **Implementation** | ⚠️ Complex workarounds | ✅ Straightforward |
| **Cost** | ✅ Minimal | ⚠️ Server resources needed |

---

### Solution 1: Server-Side Proxy (Recommended)

**Best for**: Production applications, reliability

**Architecture:**
```
Client → Your API Server → External Website → Parse Metadata → Return to Client
```

**Implementation Example (Express.js):**

```javascript
const express = require('express');
const metascraper = require('metascraper')([
  require('metascraper-title')(),
  require('metascraper-description')(),
  require('metascraper-image')(),
  require('metascraper-url')()
]);
const got = require('got');

const app = express();

// Metadata extraction endpoint
app.get('/api/metadata', async (req, res) => {
  try {
    const { url } = req.query;

    // Validate URL
    if (!url || !isValidUrl(url)) {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    // Fetch HTML with proper user agent
    const { body: html, url: finalUrl } = await got(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; MetadataBot/1.0)'
      },
      timeout: 5000,
      followRedirect: true
    });

    // Extract metadata
    const metadata = await metascraper({ html, url: finalUrl });

    // Cache the result (optional)
    await cacheMetadata(url, metadata);

    res.json(metadata);
  } catch (error) {
    console.error('Metadata extraction failed:', error);
    res.status(500).json({
      error: 'Failed to extract metadata',
      details: error.message
    });
  }
});

function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

app.listen(3000, () => console.log('Metadata API running on port 3000'));
```

**Client-side usage:**

```javascript
async function getMetadata(url) {
  try {
    const response = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`);
    if (!response.ok) throw new Error('Metadata fetch failed');
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Usage
const metadata = await getMetadata('https://example.com/product');
console.log(metadata);
```

**Enhancements:**

```javascript
// Add rate limiting
const rateLimit = require('express-rate-limit');

const metadataLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later'
});

app.use('/api/metadata', metadataLimiter);

// Add caching with Redis
const redis = require('redis');
const client = redis.createClient();

async function cacheMetadata(url, metadata) {
  const key = `metadata:${url}`;
  await client.setEx(key, 3600, JSON.stringify(metadata)); // 1 hour TTL
}

async function getCachedMetadata(url) {
  const key = `metadata:${url}`;
  const cached = await client.get(key);
  return cached ? JSON.parse(cached) : null;
}

// Modified endpoint with caching
app.get('/api/metadata', async (req, res) => {
  const { url } = req.query;

  // Check cache first
  const cached = await getCachedMetadata(url);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  // Fetch and cache if not found
  // ... rest of extraction logic
});
```

---

### Solution 2: CORS Proxy Services

**Best for**: Development, prototyping, low-volume projects

**Popular Services:**
- `cors-anywhere` (self-hosted)
- `allorigins.win` (public)
- `thingproxy.freeboard.io` (public)

**⚠️ Warning**: Public CORS proxies are unreliable and may be blocked or rate-limited.

**Implementation:**

```javascript
// Using a CORS proxy (NOT recommended for production)
async function getMetadataViaProxy(url) {
  const proxyUrl = 'https://cors-anywhere.herokuapp.com/';

  try {
    const response = await fetch(proxyUrl + url);
    const html = await response.text();

    // Parse HTML for OG tags
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    return {
      title: doc.querySelector('meta[property="og:title"]')?.content,
      description: doc.querySelector('meta[property="og:description"]')?.content,
      image: doc.querySelector('meta[property="og:image"]')?.content,
      url: doc.querySelector('meta[property="og:url"]')?.content
    };
  } catch (error) {
    console.error('Proxy fetch failed:', error);
    throw error;
  }
}
```

**Self-hosted CORS Proxy:**

```javascript
// cors-anywhere setup
const corsAnywhere = require('cors-anywhere');

const host = '0.0.0.0';
const port = 8080;

corsAnywhere.createServer({
  originWhitelist: [], // Allow all origins (or specify your domains)
  requireHeader: ['origin', 'x-requested-with'],
  removeHeaders: ['cookie', 'cookie2']
}).listen(port, host, () => {
  console.log(`CORS Anywhere running on ${host}:${port}`);
});
```

---

### Solution 3: Browser Extension

**Best for**: User-installed tools, personal use

**Approach**: Browser extensions can bypass CORS because they run with elevated privileges.

**Manifest V3 Example:**

```json
{
  "manifest_version": 3,
  "name": "Wishlist Metadata Extractor",
  "version": "1.0",
  "permissions": [
    "activeTab",
    "storage"
  ],
  "host_permissions": [
    "https://*/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"]
    }
  ]
}
```

**Background script:**

```javascript
// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchMetadata') {
    fetch(request.url)
      .then(response => response.text())
      .then(html => {
        // Parse metadata
        const metadata = parseMetadata(html);
        sendResponse({ success: true, metadata });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }
});

function parseMetadata(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  return {
    title: doc.querySelector('meta[property="og:title"]')?.content,
    description: doc.querySelector('meta[property="og:description"]')?.content,
    image: doc.querySelector('meta[property="og:image"]')?.content
  };
}
```

---

### Solution 4: Puppeteer/Playwright (Server-Side Headless Browser)

**Best for**: JavaScript-heavy sites, SPAs, complex scraping

**Pros:**
- ✅ Executes JavaScript like a real browser
- ✅ Bypasses most anti-bot measures
- ✅ Can handle dynamic content
- ✅ Takes screenshots

**Cons:**
- ❌ Resource-intensive (high CPU/memory)
- ❌ Slower than simple HTTP requests
- ❌ More complex to deploy

**Implementation Example:**

```javascript
const puppeteer = require('puppeteer');

async function extractMetadataWithPuppeteer(url) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Set realistic viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    );

    // Navigate and wait for content
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Extract metadata from page
    const metadata = await page.evaluate(() => {
      const getMeta = (property) => {
        const element = document.querySelector(`meta[property="${property}"]`) ||
                       document.querySelector(`meta[name="${property}"]`);
        return element?.content || '';
      };

      return {
        title: getMeta('og:title') || document.title,
        description: getMeta('og:description') || getMeta('description'),
        image: getMeta('og:image'),
        url: getMeta('og:url') || window.location.href,
        siteName: getMeta('og:site_name'),
        type: getMeta('og:type'),
        // Extract price if available
        price: document.querySelector('[itemprop="price"]')?.content ||
               document.querySelector('.price')?.textContent.trim()
      };
    });

    await browser.close();
    return metadata;
  } catch (error) {
    await browser.close();
    throw error;
  }
}

// Usage
const metadata = await extractMetadataWithPuppeteer('https://example.com/product');
console.log(metadata);
```

**Optimization with Connection Pooling:**

```javascript
const { createBrowserPool } = require('browser-pool');
const puppeteer = require('puppeteer');

// Create a browser pool for better performance
const pool = createBrowserPool({
  minInstances: 1,
  maxInstances: 5,
  puppeteer
});

async function extractMetadataBatch(urls) {
  const results = await Promise.all(
    urls.map(url =>
      pool.process(async ({ page }) => {
        await page.goto(url, { waitUntil: 'networkidle2' });
        return await page.evaluate(/* ... metadata extraction ... */);
      })
    )
  );

  return results;
}

// Don't forget to close the pool
process.on('exit', () => pool.destroy());
```

---

### Anti-Scraping Countermeasures

**Common Challenges:**

1. **Rate Limiting**
   - Solution: Implement delays, use proxies, respect robots.txt

2. **IP Blocking**
   - Solution: Rotate proxies, use residential IPs (services like Bright Data, Oxylabs)

3. **User-Agent Detection**
   - Solution: Rotate user agents, mimic real browsers

4. **CAPTCHA**
   - Solution: Use services like 2Captcha, Anti-Captcha (paid)

5. **JavaScript Challenges**
   - Solution: Use Puppeteer/Playwright, or services like ScraperAPI

**Best Practices:**

```javascript
// Respectful scraping configuration
const scrapingConfig = {
  // Rate limiting
  requestDelay: 1000, // 1 second between requests
  maxConcurrent: 3, // Max 3 concurrent requests

  // Retry logic
  maxRetries: 3,
  retryDelay: 2000,

  // Headers
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; YourBot/1.0; +https://yoursite.com/bot)',
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  },

  // Timeout
  timeout: 10000 // 10 seconds
};

// Implement with retry logic
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await got(url, scrapingConfig);
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;

      const delay = scrapingConfig.retryDelay * Math.pow(2, i); // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

---

## 6. Complete Implementation Example

### Full-Stack Wishlist Metadata Extractor

**Architecture:**
```
React Frontend → Express API → Metascraper → Cloudinary → Database
```

**Backend (Express + Metascraper + Cloudinary):**

```javascript
// server.js
const express = require('express');
const metascraper = require('metascraper')([
  require('metascraper-title')(),
  require('metascraper-description')(),
  require('metascraper-image')(),
  require('metascraper-url')(),
  require('metascraper-author')()
]);
const got = require('got');
const cloudinary = require('cloudinary').v2;
const Redis = require('redis');
const { body, query, validationResult } = require('express-validator');

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const redis = Redis.createClient({
  url: process.env.REDIS_URL
});
await redis.connect();

const app = express();
app.use(express.json());

// Metadata extraction endpoint
app.get('/api/extract-metadata',
  query('url').isURL().withMessage('Invalid URL'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { url } = req.query;

    try {
      // Check cache
      const cacheKey = `metadata:${url}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json({ ...JSON.parse(cached), cached: true });
      }

      // Fetch HTML
      const { body: html, url: finalUrl } = await got(url, {
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible; WishlistBot/1.0)'
        },
        timeout: 5000,
        followRedirect: true
      });

      // Extract metadata
      const metadata = await metascraper({ html, url: finalUrl });

      // Process image if available
      let optimizedImage = metadata.image;
      if (metadata.image) {
        optimizedImage = await processProductImage(metadata.image, url);
      }

      const result = {
        ...metadata,
        image: optimizedImage,
        originalImage: metadata.image,
        extractedAt: new Date().toISOString()
      };

      // Cache for 1 hour
      await redis.setEx(cacheKey, 3600, JSON.stringify(result));

      res.json(result);
    } catch (error) {
      console.error('Metadata extraction failed:', error);
      res.status(500).json({
        error: 'Failed to extract metadata',
        message: error.message
      });
    }
  }
);

// Process and cache image via Cloudinary
async function processProductImage(imageUrl, sourceUrl) {
  try {
    // Generate unique ID for image
    const imageId = Buffer.from(imageUrl).toString('base64').substring(0, 40);

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(imageUrl, {
      public_id: `wishlist/${imageId}`,
      folder: 'products',
      overwrite: false,
      invalidate: false,
      quality: 'auto:best',
      fetch_format: 'auto',
      tags: ['wishlist', 'product']
    });

    // Return optimized URL
    return cloudinary.url(result.public_id, {
      width: 800,
      height: 800,
      crop: 'limit',
      quality: 'auto:good',
      fetch_format: 'auto'
    });
  } catch (error) {
    console.error('Image processing failed:', error);
    return imageUrl; // Fallback to original
  }
}

// Batch metadata extraction
app.post('/api/extract-metadata-batch',
  body('urls').isArray({ min: 1, max: 10 }).withMessage('URLs must be array of 1-10 items'),
  body('urls.*').isURL().withMessage('Invalid URL in array'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { urls } = req.body;

    try {
      // Process all URLs in parallel (with limit)
      const results = await Promise.allSettled(
        urls.map(url => extractMetadataWithCache(url))
      );

      const processed = results.map((result, index) => ({
        url: urls[index],
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null
      }));

      res.json({ results: processed });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

async function extractMetadataWithCache(url) {
  // Check cache
  const cacheKey = `metadata:${url}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Extract metadata
  const { body: html, url: finalUrl } = await got(url, {
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; WishlistBot/1.0)' },
    timeout: 5000
  });

  const metadata = await metascraper({ html, url: finalUrl });

  // Process image
  if (metadata.image) {
    metadata.image = await processProductImage(metadata.image, url);
  }

  // Cache
  await redis.setEx(cacheKey, 3600, JSON.stringify(metadata));

  return metadata;
}

app.listen(3000, () => {
  console.log('Wishlist Metadata API running on port 3000');
});
```

**Frontend (React):**

```javascript
// MetadataExtractor.jsx
import React, { useState } from 'react';

export default function MetadataExtractor() {
  const [url, setUrl] = useState('');
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleExtract = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/extract-metadata?url=${encodeURIComponent(url)}`
      );

      if (!response.ok) {
        throw new Error('Failed to extract metadata');
      }

      const data = await response.json();
      setMetadata(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="metadata-extractor">
      <form onSubmit={handleExtract}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter product URL..."
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Extracting...' : 'Extract Metadata'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {metadata && (
        <div className="metadata-preview">
          {metadata.image && (
            <img src={metadata.image} alt={metadata.title} />
          )}
          <h2>{metadata.title}</h2>
          <p>{metadata.description}</p>
          <a href={metadata.url} target="_blank" rel="noopener noreferrer">
            View Product
          </a>
          {metadata.cached && <span className="badge">Cached</span>}
        </div>
      )}
    </div>
  );
}
```

---

## 7. Recommendations & Best Practices

### Recommended Tech Stack

**For a production wishlist application:**

1. **Metadata Extraction**: `metascraper` (server-side)
2. **Image Processing**: Cloudinary (or imgix if you have existing storage)
3. **Caching**: Redis (for metadata) + CDN (for images)
4. **API Framework**: Express.js or Next.js API routes
5. **Scraping (if needed)**: Puppeteer or paid services (ScraperAPI)

### Implementation Strategy

```
Phase 1: Basic Metadata Extraction
└── Implement server-side proxy with metascraper
└── Add basic caching with Redis
└── Handle common retailers (Amazon, Target, etc.)

Phase 2: Image Optimization
└── Integrate Cloudinary for image caching
└── Implement responsive image generation
└── Add fallback to original images

Phase 3: Advanced Features
└── Batch processing for multiple URLs
└── Implement retry logic and error handling
└── Add support for wishlist parsing (if needed)

Phase 4: Optimization
└── Implement rate limiting
└── Add monitoring and logging
└── Optimize cache strategies
```

### Performance Optimization

```javascript
// Recommended configuration
const config = {
  // Caching
  metadataCacheTTL: 3600, // 1 hour
  imageCacheTTL: 86400, // 24 hours

  // Rate limiting
  maxRequestsPerMinute: 60,
  maxConcurrentRequests: 10,

  // Timeouts
  fetchTimeout: 5000, // 5 seconds
  puppeteerTimeout: 30000, // 30 seconds (only for complex sites)

  // Retries
  maxRetries: 3,
  retryDelay: 1000, // 1 second

  // Images
  maxImageWidth: 1920,
  imageQuality: 'auto:good',
  imageFetchFormat: 'auto' // WebP/AVIF
};
```

### Security Considerations

1. **Validate all URLs** before fetching
2. **Sanitize extracted HTML** to prevent XSS
3. **Rate limit API endpoints** to prevent abuse
4. **Use HTTPS only** for metadata extraction
5. **Implement CORS properly** for your frontend
6. **Don't expose API keys** in client-side code
7. **Monitor for suspicious patterns** (scraping detection)

### Legal & Ethical Considerations

**✅ Allowed:**
- Extracting metadata from publicly accessible pages
- Caching images with proper attribution
- Using official APIs where available

**❌ Not Allowed:**
- Scraping private/authenticated content
- Storing PII without consent (GDPR)
- Bypassing paywalls or authentication
- Violating Terms of Service
- High-frequency scraping that impacts site performance

**Best Practice**: Always check `robots.txt` and respect rate limits.

---

## 8. Conclusion

### Key Takeaways

1. **No official wishlist APIs exist** for major retailers (Amazon, Target, Walmart, Etsy)
2. **Server-side metadata extraction** is the most reliable approach
3. **Metascraper is the best library** for comprehensive metadata extraction
4. **Cloudinary offers the best all-in-one solution** for image processing
5. **CORS requires server-side proxy** for production applications
6. **Web scraping is complex** and should be used as last resort

### Final Recommendations

**For a wishlist application in 2025:**

```javascript
// Recommended architecture
{
  metadataExtraction: {
    library: 'metascraper',
    approach: 'server-side-proxy',
    caching: 'redis',
    fallback: 'open-graph-scraper'
  },
  imageProcessing: {
    service: 'cloudinary',
    alternative: 'imgix', // if existing storage
    cdn: true,
    optimization: 'automatic'
  },
  scraping: {
    approach: 'avoid-if-possible',
    alternative: 'paid-apis', // ScraperAPI, Oxylabs
    lastResort: 'puppeteer'
  },
  cors: {
    solution: 'backend-proxy',
    never: 'public-cors-proxies' // unreliable
  }
}
```

### Quick Start Implementation

```bash
# Install dependencies
npm install express metascraper metascraper-title metascraper-description \
  metascraper-image metascraper-url cloudinary redis express-rate-limit \
  express-validator got

# Set environment variables
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
REDIS_URL=redis://localhost:6379

# Run server
node server.js
```

### Next Steps

1. Implement basic metadata extraction endpoint
2. Add caching layer with Redis
3. Integrate image processing with Cloudinary
4. Add error handling and retry logic
5. Implement rate limiting
6. Add monitoring and logging
7. Test with various retailers
8. Optimize for performance
9. Deploy to production

---

## Appendix: Code Snippets Library

### A. URL Validation

```javascript
function isValidProductUrl(url) {
  try {
    const parsed = new URL(url);

    // Check protocol
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    // Check for common e-commerce domains (optional)
    const knownRetailers = [
      'amazon.com', 'target.com', 'walmart.com',
      'etsy.com', 'ebay.com', 'wayfair.com'
    ];

    const isKnownRetailer = knownRetailers.some(
      domain => parsed.hostname.includes(domain)
    );

    return true; // or return isKnownRetailer for strict validation
  } catch {
    return false;
  }
}
```

### B. Error Handling Wrapper

```javascript
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Usage
app.get('/api/metadata', asyncHandler(async (req, res) => {
  const metadata = await extractMetadata(req.query.url);
  res.json(metadata);
}));

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({
    error: {
      message: error.message,
      status: error.status || 500,
      timestamp: new Date().toISOString()
    }
  });
});
```

### C. Batch Processing with Concurrency Control

```javascript
async function batchProcess(items, batchSize, processFn) {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(processFn)
    );
    results.push(...batchResults);

    // Add delay between batches
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

// Usage
const urls = ['url1', 'url2', 'url3', ...];
const results = await batchProcess(urls, 3, extractMetadata);
```

---

## References

1. Open Graph Protocol: https://ogp.me/
2. Metascraper Documentation: https://metascraper.js.org/
3. Open Graph Scraper: https://www.npmjs.com/package/open-graph-scraper
4. Unfurl.js: https://github.com/jacktuck/unfurl
5. Cloudinary Documentation: https://cloudinary.com/documentation
6. imgix Documentation: https://docs.imgix.com/
7. ScraperAPI: https://www.scraperapi.com/
8. Puppeteer: https://pptr.dev/

---

*Research conducted: November 2, 2025*
*Document version: 1.0*
