# Future Improvements

## Code Quality

1. **No duplicate ID validation** - We validate references exist, but don't check for duplicate room/item IDs which would cause silent bugs.

2. **Inconsistent item visibility** - Items have `location` for containers, but the visibility logic (`getRoomItems` vs `getAllRoomItems`) is spread across multiple methods.
