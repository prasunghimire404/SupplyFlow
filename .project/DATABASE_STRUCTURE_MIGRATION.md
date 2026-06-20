# Database Structure Migration - User-Centric Organization

## Overview

Your Firebase Realtime Database has been successfully migrated from a **workspace-centric model** to a **user-centric model**. This means all data is now organized within user profiles, providing better data isolation and security.

## New Structure

```
root/
├── emails/
│   └── {safe_email}: userId
│
└── users/
    └── {userId}/
        ├── businessName
        ├── displayName
        ├── email
        ├── ownerName
        ├── phone
        ├── address
        ├── photoURL
        ├── activeWorkspaceId
        ├── createdAt
        ├── updatedAt
        └── workspaces/
            └── {workspaceId}/
                ├── name
                ├── ownerId
                ├── type
                ├── createdAt
                ├── updatedAt
                ├── collaborators/
                │   └── {userId}: { role, joinedAt }
                ├── bills/
                │   └── {billId}: { customerName, total, status, ... }
                ├── products/
                │   └── {productId}: { name, price, stock, ... }
                ├── categories/
                │   └── {categoryId}: { name }
                ├── customers/
                │   └── {customerId}: { name, phone, balance, ... }
                ├── suppliers/
                │   └── {supplierId}: { name, amount, ... }
                └── dashboard/
                    └── { kpis, metrics, ... }
```

## Old vs New Path Examples

### Bills
```typescript
// OLD
dbRef(rtdb, `workspaces/${workspaceId}/bills`)

// NEW
dbRef(rtdb, `users/${uid}/workspaces/${workspaceId}/bills`)
```

### Products
```typescript
// OLD
dbRef(rtdb, `workspaces/${workspaceId}/products/${productId}`)

// NEW
dbRef(rtdb, `users/${uid}/workspaces/${workspaceId}/products/${productId}`)
```

### Customers
```typescript
// OLD
dbRef(rtdb, `workspaces/${workspaceId}/customers/${customerId}`)

// NEW
dbRef(rtdb, `users/${uid}/workspaces/${workspaceId}/customers/${customerId}`)
```

## Files Updated

### Authentication
- ✅ `src/services/auth.service.ts`
  - Updated signup to create workspaces under user profile
  - Updated user profile retrieval

### Dashboard & Main Screens
- ✅ `src/app/index.tsx` - Dashboard home
- ✅ `src/app/(tabs)/index.tsx` - Tab dashboard
- ✅ `src/app/(tabs)/billing.tsx` - Billing operations
- ✅ `src/app/(tabs)/inventory.tsx` - Product management

### Khata (Customer Management)
- ✅ `src/app/(tabs)/khata/index.tsx` - Customer list
- ✅ `src/app/(tabs)/khata/[id].tsx` - Customer details
- ✅ `src/app/(tabs)/khata/add-client.tsx` - Add customer
- ✅ `src/app/(tabs)/khata/pending-collections.tsx` - Pending collections
- ✅ `src/app/(tabs)/khata/pending-payments.tsx` - Pending payments
- ✅ `src/app/pending-collections.tsx` - Root pending collections

## Key Changes

### 1. User ID Context
All database operations now require both:
- `uid` - User ID from authentication
- `workspaceId` - Active workspace selection

### 2. Path Construction Pattern
```typescript
const uid = user?.uid;
const workspaceId = user?.activeWorkspaceId;

// Get any workspace resource
dbRef(rtdb, `users/${uid}/workspaces/${workspaceId}/customers`)
```

### 3. Permission Model
This structure enables:
- **User isolation**: Each user owns their workspace data
- **Better security rules**: Can enforce that users only access their own data
- **Multi-workspace support**: Users can have multiple workspaces
- **Easier audit trails**: All data is under the user who created it

## Migration Notes

### No Data Lost
- All existing workspace data needs to be migrated manually or via a migration script
- The email-to-UID mapping is preserved at the root level

### Email Storage
- Email-to-UID mapping remains at `emails/{safe_email}` for sign-in functionality
- This allows users to be looked up by email efficiently

### Backwards Compatibility
- Old paths will no longer work
- All client code must use new paths
- Migration script should be run on existing data if you have it

## Implementation Details

### Getting User Context
```typescript
import { useAuthStore } from "@/store/auth-store";

// In component
const { user } = useAuthStore();
const uid = user?.uid;
const workspaceId = user?.activeWorkspaceId;
```

### Database Operations
```typescript
import { ref as dbRef, get as dbGet, set as dbSet } from "firebase/database";
import { rtdb } from "@/services/firebase";

// Read
const snap = await dbGet(
  dbRef(rtdb, `users/${uid}/workspaces/${workspaceId}/customers`)
);

// Write
await dbSet(
  dbRef(rtdb, `users/${uid}/workspaces/${workspaceId}/customers/${id}`),
  { name: "John", balance: 100 }
);
```

## Firebase Security Rules (Recommended)

```json
{
  "rules": {
    "emails": {
      ".read": true,
      "$email": {
        ".validate": "newData.isString()"
      }
    },
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid",
        "workspaces": {
          "$workspaceId": {
            ".read": "root.child('users').child(auth.uid).child('workspaces').child($workspaceId).exists()",
            ".write": "root.child('users').child(auth.uid).child('workspaces').child($workspaceId).exists()",
            "collaborators": {
              ".read": true,
              "$collaboratorId": {
                ".validate": "newData.isString()"
              }
            }
          }
        }
      }
    }
  }
}
```

## Troubleshooting

### "Cannot read path workspaces/..."
This means the code is still using old paths. Search for these patterns:
- `workspaces/${workspaceId}` → `users/${uid}/workspaces/${workspaceId}`
- `users/${uid}` (for workspace data) → `users/${uid}/workspaces/${workspaceId}`

### "Undefined uid" error
Ensure user is authenticated before attempting operations:
```typescript
if (!user?.uid || !user?.activeWorkspaceId) {
  return; // User not ready
}
```

### Data not appearing
Double-check:
1. Firebase rules allow the operation
2. Both `uid` and `workspaceId` are available
3. The data path is correct (especially nesting under users/uid/workspaces)

## Performance Considerations

✅ **Improved:**
- Better indexing possibilities per user
- Reduced data transfer for multi-user systems
- Easier to implement access controls

⚠️ **Monitor:**
- Queries across multiple users may need different approaches
- Analytics/reporting may need new aggregation logic

## Next Steps

1. If migrating existing data, run a migration script:
   - Read from `workspaces/{id}`
   - Write to `users/{uid}/workspaces/{id}`

2. Update Firebase rules to enforce user isolation

3. Test all operations with the new structure

4. Monitor for any missing `uid` or `workspaceId` errors

## Questions?

Review the code in:
- `src/services/auth.service.ts` for authentication patterns
- `src/app/(tabs)/billing.tsx` for data operation examples
- `src/app/index.tsx` for dashboard query examples
