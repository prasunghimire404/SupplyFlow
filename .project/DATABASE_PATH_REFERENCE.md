# Database Path Reference Guide

## Quick Reference for Database Paths

### Format
All paths follow this structure:
```
users/{userId}/workspaces/{workspaceId}/{resource}/{resourceId}
```

## Resource Paths

### Authentication & Profile
| Resource | Old Path | New Path |
|----------|----------|----------|
| Email lookup | `emails/{email}` | `emails/{email}` (unchanged) |
| User profile | `users/{uid}` | `users/{uid}` (unchanged) |

### Workspace Data
| Resource | Old Path | New Path |
|----------|----------|----------|
| Workspace metadata | `workspaces/{wsId}` | `users/{uid}/workspaces/{wsId}` |
| Collaborators | `workspaces/{wsId}/collaborators` | `users/{uid}/workspaces/{wsId}/collaborators` |
| Bills | `workspaces/{wsId}/bills` | `users/{uid}/workspaces/{wsId}/bills` |
| Products | `workspaces/{wsId}/products` | `users/{uid}/workspaces/{wsId}/products` |
| Customers | `workspaces/{wsId}/customers` | `users/{uid}/workspaces/{wsId}/customers` |
| Suppliers | `workspaces/{wsId}/suppliers` | `users/{uid}/workspaces/{wsId}/suppliers` |
| Categories | `workspaces/{wsId}/categories` | `users/{uid}/workspaces/{wsId}/categories` |
| Dashboard | `workspaces/{wsId}/dashboard` | `users/{uid}/workspaces/{wsId}/dashboard` |

## Code Examples

### Reading Data
```typescript
// OLD ❌
const snap = await dbGet(dbRef(rtdb, `workspaces/${workspaceId}/customers`));

// NEW ✅
const snap = await dbGet(dbRef(rtdb, `users/${uid}/workspaces/${workspaceId}/customers`));
```

### Writing Data
```typescript
// OLD ❌
await dbSet(dbRef(rtdb, `workspaces/${workspaceId}/products/${productId}`), productData);

// NEW ✅
await dbSet(dbRef(rtdb, `users/${uid}/workspaces/${workspaceId}/products/${productId}`), productData);
```

### Nested Updates
```typescript
// OLD ❌
const ref = dbRef(rtdb, `workspaces/${workspaceId}/customers/${customerId}/balance`);

// NEW ✅
const ref = dbRef(rtdb, `users/${uid}/workspaces/${workspaceId}/customers/${customerId}/balance`);
```

## Variables to Use

```typescript
// Get current user
const user = authService.getCurrentUser();
// or
const { user, userProfile } = useAuthStore();

// Extract needed values
const uid = user?.uid;  // or userProfile?.uid
const workspaceId = user?.activeWorkspaceId;  // or userProfile?.activeWorkspaceId
```

## Validation Pattern

Always validate both user and workspace:
```typescript
if (!uid || !workspaceId) {
  // Handle error - return early
  return;
}

// Safe to proceed with database operations
```

## Common Operations

### Load Collections
```typescript
const snap = await dbGet(
  dbRef(rtdb, `users/${uid}/workspaces/${workspaceId}/customers`)
);

if (snap.exists()) {
  const data = snap.val();
  // Process data...
}
```

### Create Item
```typescript
const itemId = `item_${Date.now()}`;
await dbSet(
  dbRef(rtdb, `users/${uid}/workspaces/${workspaceId}/products/${itemId}`),
  {
    name: "Product Name",
    price: 100,
    createdAt: Date.now(),
  }
);
```

### Update Field
```typescript
await dbSet(
  dbRef(rtdb, `users/${uid}/workspaces/${workspaceId}/customers/${customerId}/balance`),
  newBalance
);
```

### Delete Item
```typescript
await dbRemove(
  dbRef(rtdb, `users/${uid}/workspaces/${workspaceId}/suppliers/${supplierId}`)
);
```

### Real-time Listener
```typescript
const dashboardRef = dbRef(
  rtdb,
  `users/${uid}/workspaces/${workspaceId}/dashboard`
);

const unsubscribe = onValue(dashboardRef, (snapshot) => {
  if (snapshot.exists()) {
    const data = snapshot.val();
    // Process real-time data...
  }
});

// Don't forget to unsubscribe
return () => unsubscribe();
```

## Security Rules Pattern

Rules should enforce user ownership:
```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid",
        "workspaces": {
          "$workspaceId": {
            ".read": "root.child('users').child(auth.uid).child('workspaces').child($workspaceId).exists()",
            ".write": "root.child('users').child(auth.uid).child('workspaces').child($workspaceId).exists()"
          }
        }
      }
    }
  }
}
```

## Files Using New Paths

✅ auth.service.ts
✅ app/index.tsx
✅ app/(tabs)/index.tsx
✅ app/(tabs)/billing.tsx
✅ app/(tabs)/inventory.tsx
✅ app/(tabs)/khata/index.tsx
✅ app/(tabs)/khata/[id].tsx
✅ app/(tabs)/khata/add-client.tsx
✅ app/(tabs)/khata/pending-collections.tsx
✅ app/(tabs)/khata/pending-payments.tsx
✅ app/pending-collections.tsx
