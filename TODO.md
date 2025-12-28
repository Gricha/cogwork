# Future Improvements

## Code Quality

1. **`useActions` matching is complex** - Finding the right action involves matching targetId, number, requires conditions in a nested loop. Could be simplified.

2. **No duplicate ID validation** - We validate references exist, but don't check for duplicate room/item IDs which would cause silent bugs.

3. **Inconsistent item visibility** - Items have `location` for containers, but the visibility logic (`getRoomItems` vs `getAllRoomItems`) is spread across multiple methods.
