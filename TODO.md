# Future Improvements

## Code Quality

1. **Fragment effects violate separation of concerns** - Description fragments can have `effects`, meaning rendering text can mutate game state. This is surprising behavior.

2. **`useActions` matching is complex** - Finding the right action involves matching targetId, number, requires conditions in a nested loop. Could be simplified.

3. **No duplicate ID validation** - We validate references exist, but don't check for duplicate room/item IDs which would cause silent bugs.

4. **`once` system is awkward** - There's `once` condition, `markOnce` effect, plus `hasOnce`/`markOnce` methods. The interaction between these could be clearer.

5. **Inconsistent item visibility** - Items have `location` for containers, but the visibility logic (`getRoomItems` vs `getAllRoomItems`) is spread across multiple methods.
