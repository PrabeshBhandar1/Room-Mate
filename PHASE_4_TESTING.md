# Phase 4 Testing Guide

## Prerequisites
1. Ensure the development server is running (`npm run dev`)
2. Have at least one owner account with some listings created
3. Create an admin account (see instructions below)

## Creating an Admin User

### Method 1: Through Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Users**
3. Click **Add User** (or use an existing user)
4. Set email (e.g., `admin@roommate.com`) and password
5. After user is created, go to **Table Editor** → **profiles**
6. Find the user's profile row
7. Edit the `role` field to `admin`
8. Save changes

### Method 2: Using SQL Editor
1. Go to **SQL Editor** in Supabase
2. Run the script from `supabase/create_admin_user.sql`
3. Follow the instructions in the script

## Test Scenarios

### 1. Admin Dashboard Access
**Test:** Verify admin can access dashboard
- [ ] Log in with admin credentials
- [ ] Should redirect to `/admin/dashboard`
- [ ] Header should show "RoomMate Admin"
- [ ] Should see welcome message with admin name

**Test:** Verify non-admin cannot access
- [ ] Log in with owner account
- [ ] Try to navigate to `/admin/dashboard`
- [ ] Should be redirected away (protected route)

### 2. Statistics Display
**Test:** Verify statistics are accurate
- [ ] Check "Total Listings" matches actual count in database
- [ ] Check "Pending Review" shows only pending listings
- [ ] Check "Total Users" matches user count
- [ ] Check "Active Owners" shows only users with role='owner'

### 3. Pending Listings View
**Test:** Display pending listings
- [ ] Create 2-3 listings as an owner
- [ ] Log in as admin
- [ ] All pending listings should appear in the list
- [ ] Each listing should show: title, price, location, type, owner name
- [ ] Each listing should have 3 buttons: View Details, Approve, Reject

**Test:** Empty state
- [ ] Approve or reject all pending listings
- [ ] Dashboard should show "No pending listings" message

### 4. Quick Approve from Dashboard
**Test:** Approve a listing directly
- [ ] Click "Approve" on a pending listing
- [ ] Button should show "Processing..." during action
- [ ] Listing should disappear from pending list
- [ ] "Pending Review" count should decrease by 1
- [ ] Log in as owner and verify listing status is "Approved"

### 5. Quick Reject from Dashboard
**Test:** Reject a listing with reason
- [ ] Click "Reject" on a pending listing
- [ ] Should see prompt asking for rejection reason
- [ ] Enter a reason (e.g., "Incomplete information")
- [ ] Click OK
- [ ] Listing should disappear from pending list
- [ ] Log in as owner and verify:
  - Listing status is "Rejected"
  - Rejection reason is displayed

**Test:** Reject without reason
- [ ] Click "Reject" on a pending listing
- [ ] Leave reason blank and click OK
- [ ] Should still reject successfully

**Test:** Cancel rejection
- [ ] Click "Reject" on a pending listing
- [ ] Click Cancel on the prompt
- [ ] Listing should remain in pending list

### 6. View Details Navigation
**Test:** Navigate to detail page
- [ ] Click "View Details" on a pending listing
- [ ] Should navigate to `/admin/listing/[id]`
- [ ] Page should load without errors
- [ ] "Back to Dashboard" link should be visible

### 7. Listing Detail Page - Photo Gallery
**Test:** View photos
- [ ] Verify main photo displays correctly
- [ ] If multiple photos exist, verify thumbnail strip appears
- [ ] Click on different thumbnails
- [ ] Main photo should change to selected thumbnail
- [ ] Selected thumbnail should have blue border

**Test:** No photos
- [ ] View a listing with no photos
- [ ] Should show placeholder or gracefully handle missing photos

### 8. Listing Detail Page - Information Display
**Test:** Verify all information is shown
- [ ] Title is displayed correctly
- [ ] Status badge shows correct status and color
- [ ] Description is fully visible
- [ ] Property details section shows:
  - Type (Room/Flat)
  - Price per month
  - Location
  - Bathrooms
  - For flats: Bedrooms and Kitchens
- [ ] Amenities are displayed as styled badges
- [ ] Owner information shows:
  - Display name
  - Email
  - Phone (if available)

### 9. Listing Detail Page - Approve Action
**Test:** Approve from detail page
- [ ] Click "Approve Listing" button
- [ ] Should see confirmation dialog
- [ ] Click OK
- [ ] Button should show "Processing..."
- [ ] Should see success alert
- [ ] Should redirect to `/admin/dashboard`
- [ ] Listing should no longer appear in pending list

### 10. Listing Detail Page - Reject Action
**Test:** Reject from detail page
- [ ] Click "Reject Listing" button
- [ ] Should see prompt for rejection reason
- [ ] Enter reason and click OK
- [ ] Button should show "Processing..."
- [ ] Should redirect to `/admin/dashboard`
- [ ] Listing should no longer appear in pending list

### 11. Already Approved/Rejected Listings
**Test:** View approved listing
- [ ] Navigate directly to `/admin/listing/[approved-listing-id]`
- [ ] Status badge should show "Approved" in green
- [ ] Action buttons should NOT be visible
- [ ] All other information should display normally

**Test:** View rejected listing
- [ ] Navigate directly to `/admin/listing/[rejected-listing-id]`
- [ ] Status badge should show "Rejected" in red
- [ ] Should see rejection reason box (if reason exists)
- [ ] Action buttons should NOT be visible

### 12. Error Handling
**Test:** Invalid listing ID
- [ ] Navigate to `/admin/listing/invalid-id`
- [ ] Should show "Listing not found" message
- [ ] Should have "Back to Dashboard" link

**Test:** Network error simulation
- [ ] Disconnect internet
- [ ] Try to approve/reject a listing
- [ ] Should show error alert
- [ ] Should not crash the application

### 13. Responsive Design
**Test:** Mobile view
- [ ] Resize browser to mobile width (375px)
- [ ] Dashboard should be readable and functional
- [ ] Statistics cards should stack vertically
- [ ] Listing cards should be responsive
- [ ] Detail page should be scrollable
- [ ] All buttons should be tappable

**Test:** Tablet view
- [ ] Resize browser to tablet width (768px)
- [ ] Layout should adapt appropriately
- [ ] Grid should show 2 columns for stats

### 14. UI/UX Polish
**Test:** Loading states
- [ ] Refresh dashboard
- [ ] Should see spinner while loading
- [ ] Should see "Loading dashboard data..." message

**Test:** Hover effects
- [ ] Hover over listing cards
- [ ] Border should change color
- [ ] Hover over buttons
- [ ] Background should change slightly

**Test:** Disabled states
- [ ] Click Approve/Reject
- [ ] During processing, buttons should be disabled
- [ ] Opacity should be reduced
- [ ] Clicking again should have no effect

## Expected Behavior Summary

### Successful Approval Flow:
1. Owner creates listing → Status: Pending
2. Admin sees listing on dashboard
3. Admin approves listing
4. Status changes to: Approved
5. Listing becomes visible to public (Phase 5)
6. Owner sees "Approved" badge on their dashboard

### Successful Rejection Flow:
1. Owner creates listing → Status: Pending
2. Admin sees listing on dashboard
3. Admin rejects with reason
4. Status changes to: Rejected
5. Owner sees "Rejected" badge and reason
6. Owner can edit and resubmit

## Common Issues & Solutions

### Issue: Admin can't access dashboard
**Solution:** Verify role is set to 'admin' in profiles table

### Issue: Statistics show 0
**Solution:** Check RLS policies allow admin to read all tables

### Issue: Photos not loading
**Solution:** Verify Supabase storage bucket is public and URLs are correct

### Issue: Approve/Reject not working
**Solution:** Check browser console for errors, verify RLS policies

## Performance Checks
- [ ] Dashboard loads in < 2 seconds
- [ ] Detail page loads in < 1.5 seconds
- [ ] Photo gallery is smooth (no lag when switching)
- [ ] No console errors or warnings
- [ ] No memory leaks (check DevTools)

## Accessibility Checks
- [ ] All buttons have clear labels
- [ ] Color contrast is sufficient
- [ ] Keyboard navigation works
- [ ] Screen reader friendly (semantic HTML)

---

**Testing Complete!** ✅

Once all tests pass, Phase 4 is ready for production. Proceed to Phase 5 (Public Interface).
