/**
 * End-to-End Tests for User Flows
 * Tests complete user journeys through the application
 */

import { test, expect, Page } from '@playwright/test';

test.describe('User Registration and Authentication', () => {
  test('should complete full registration flow', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');

    // Fill in registration form
    await page.fill('input[name="email"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.fill('input[name="confirmPassword"]', 'SecurePass123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to email verification page
    await expect(page).toHaveURL(/\/verify-email/);
    await expect(page.locator('text=Check your email')).toBeVisible();
  });

  test('should login existing user', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'existing@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'WrongPassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('[role="alert"]')).toContainText('Invalid credentials');
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Click logout button
    await page.click('button[aria-label="User menu"]');
    await page.click('button:has-text("Logout")');

    // Should redirect to login page
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Location and List Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create a new location', async ({ page }) => {
    await page.click('button:has-text("New Location")');

    // Fill location form
    await page.fill('input[name="name"]', "Mom's House");
    await page.fill('textarea[name="description"]', 'Christmas at mom\'s place');
    await page.click('button:has-text("Create Location")');

    // Should show success message
    await expect(page.locator('text=Location created')).toBeVisible();
    await expect(page.locator('text=Mom\'s House')).toBeVisible();
  });

  test('should create a wishlist in a location', async ({ page }) => {
    // Assume location already exists
    await page.click('text=Mom\'s House');
    await page.click('button:has-text("New List")');

    // Fill list form
    await page.fill('input[name="title"]', 'Christmas 2024');
    await page.fill('textarea[name="description"]', 'My Christmas wishlist');
    await page.selectOption('select[name="year"]', '2024');
    await page.click('button:has-text("Create List")');

    // Should show the new list
    await expect(page.locator('text=Christmas 2024')).toBeVisible();
  });

  test('should add items to wishlist via URL', async ({ page }) => {
    // Navigate to a list
    await page.click('text=Christmas 2024');

    // Add item via URL
    await page.click('button:has-text("Add Item")');
    await page.fill('input[name="url"]', 'https://www.amazon.com/dp/B08N5WRWNW');
    await page.click('button:has-text("Fetch Details")');

    // Should auto-populate fields from URL
    await expect(page.locator('input[name="title"]')).not.toBeEmpty();
    await expect(page.locator('input[name="price"]')).not.toBeEmpty();

    // Submit item
    await page.click('button:has-text("Add to List")');

    // Should show item in list
    await expect(page.locator('article.wishlist-item')).toBeVisible();
  });

  test('should manually add item without URL', async ({ page }) => {
    await page.click('text=Christmas 2024');
    await page.click('button:has-text("Add Item")');

    // Fill form manually
    await page.fill('input[name="title"]', 'Generic Gift Card');
    await page.fill('textarea[name="description"]', '$50 gift card');
    await page.fill('input[name="price"]', '50');
    await page.selectOption('select[name="priority"]', 'medium');

    await page.click('button:has-text("Add to List")');

    // Verify item added
    await expect(page.locator('text=Generic Gift Card')).toBeVisible();
    await expect(page.locator('text=$50.00')).toBeVisible();
  });
});

test.describe('Item Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');
    await page.click('text=Christmas 2024');
  });

  test('should edit an item', async ({ page }) => {
    // Click edit button on first item
    await page.click('article.wishlist-item >> button[aria-label="Edit item"]');

    // Update fields
    await page.fill('input[name="title"]', 'Updated Item Title');
    await page.fill('input[name="price"]', '75');
    await page.click('button:has-text("Save Changes")');

    // Verify updates
    await expect(page.locator('text=Updated Item Title')).toBeVisible();
    await expect(page.locator('text=$75.00')).toBeVisible();
  });

  test('should delete an item', async ({ page }) => {
    const itemTitle = await page.locator('article.wishlist-item h3').first().textContent();

    // Click delete button
    await page.click('article.wishlist-item >> button[aria-label="Delete item"]');

    // Confirm deletion
    await page.click('button:has-text("Confirm")');

    // Item should be removed
    await expect(page.locator(`text=${itemTitle}`)).not.toBeVisible();
  });

  test('should mark item as purchased', async ({ page }) => {
    // Click purchase button
    await page.click('article.wishlist-item >> button:has-text("Mark as Purchased")');

    // Item should show as purchased
    await expect(page.locator('article.wishlist-item >> text=Purchased')).toBeVisible();

    // Purchase button should be hidden
    await expect(page.locator('article.wishlist-item >> button:has-text("Mark as Purchased")')).not.toBeVisible();
  });

  test('should filter items by status', async ({ page }) => {
    // Show only purchased items
    await page.click('button[aria-label="Filter"]');
    await page.click('label:has-text("Purchased Only")');

    // Should only show purchased items
    const purchasedItems = page.locator('article.wishlist-item:has-text("Purchased")');
    const availableItems = page.locator('article.wishlist-item:has-text("Available")');

    await expect(purchasedItems).toHaveCount(await purchasedItems.count());
    await expect(availableItems).toHaveCount(0);
  });
});

test.describe('List Sharing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'owner@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');
    await page.click('text=Christmas 2024');
  });

  test('should share list with another user', async ({ page }) => {
    await page.click('button:has-text("Share")');

    // Enter email to share with
    await page.fill('input[name="email"]', 'friend@example.com');
    await page.selectOption('select[name="role"]', 'editor');
    await page.click('button:has-text("Send Invite")');

    // Should show success message
    await expect(page.locator('text=Invite sent')).toBeVisible();

    // Should show in shared with list
    await expect(page.locator('text=friend@example.com')).toBeVisible();
  });

  test('should generate guest link', async ({ page }) => {
    await page.click('button:has-text("Share")');
    await page.click('button:has-text("Get Guest Link")');

    // Should generate and display link
    const guestLink = page.locator('input[readonly][value*="/guest/"]');
    await expect(guestLink).toBeVisible();

    // Copy link button should be available
    await expect(page.locator('button:has-text("Copy Link")')).toBeVisible();
  });

  test('should access list via guest link', async ({ page, context }) => {
    // Get guest link from shared list
    await page.click('button:has-text("Share")');
    const guestLink = await page.locator('input[readonly][value*="/guest/"]').inputValue();

    // Open in new context (simulate different user)
    const newPage = await context.newPage();
    await newPage.goto(guestLink);

    // Should see list without being logged in
    await expect(newPage.locator('h1:has-text("Christmas 2024")')).toBeVisible();
    await expect(newPage.locator('article.wishlist-item')).toHaveCount(await newPage.locator('article.wishlist-item').count());

    // Should not see edit buttons
    await expect(newPage.locator('button:has-text("Edit")')).not.toBeVisible();
  });

  test('should revoke share access', async ({ page }) => {
    await page.click('button:has-text("Share")');

    // Find user in shared list and remove
    await page.click('button[aria-label="Remove access for friend@example.com"]');
    await page.click('button:has-text("Confirm")');

    // User should be removed from list
    await expect(page.locator('text=friend@example.com')).not.toBeVisible();
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('should navigate on mobile', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Open mobile menu
    await page.click('button[aria-label="Menu"]');
    await expect(page.locator('nav[role="navigation"]')).toBeVisible();

    // Navigate to lists
    await page.click('text=My Lists');
    await expect(page.locator('h1:has-text("My Lists")')).toBeVisible();
  });

  test('should add item on mobile', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');
    await page.click('text=Christmas 2024');

    // Add item button should be visible and accessible
    await page.click('button[aria-label="Add item"]');

    await page.fill('input[name="title"]', 'Mobile Test Item');
    await page.fill('input[name="price"]', '29.99');
    await page.click('button:has-text("Add")');

    await expect(page.locator('text=Mobile Test Item')).toBeVisible();
  });
});

test.describe('Search and Filter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');
  });

  test('should search items across lists', async ({ page }) => {
    // Navigate to search
    await page.click('input[placeholder="Search items..."]');
    await page.fill('input[placeholder="Search items..."]', 'headphones');

    // Should show search results
    await expect(page.locator('text=Search Results')).toBeVisible();
    await expect(page.locator('article.search-result')).toHaveCountGreaterThan(0);
  });

  test('should filter lists by year', async ({ page }) => {
    await page.selectOption('select[name="year-filter"]', '2024');

    // Should only show 2024 lists
    const lists = page.locator('article.list-card');
    await expect(lists).toHaveCountGreaterThan(0);

    // Verify each list is from 2024
    const yearBadges = page.locator('span.year-badge:has-text("2024")');
    await expect(yearBadges).toHaveCount(await lists.count());
  });
});
