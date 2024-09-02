# redisgoose
Simulate mongo command on redis

# Redis Model Usage Guide

This guide provides comprehensive instructions on how to use the `RedisModel` class, which offers MongoDB-like operations for working with Redis.

## Table of Contents
1. [Installation](#installation)
2. [Initialization](#initialization)
3. [CRUD Operations](#crud-operations)
   - [Create](#create)
   - [Read](#read)
   - [Update](#update)
   - [Delete](#delete)
4. [Query Operations](#query-operations)
5. [Count Documents](#count-documents)
6. [Error Handling](#error-handling)

## Installation

Before using the `RedisModel`, make sure you have the required dependencies installed:

```bash
npm install ioredis uuid
```

## Initialization

To use the `RedisModel`, first import it and create an instance:

```javascript
const RedisModel = require('./RedisModel');

const userSchema = {
  name: { type: 'string' },
  age: { type: 'number' },
  email: { type: 'string' }
};

const UserModel = new RedisModel('User', userSchema);
```

## CRUD Operations

### Create

To create a new document:

```javascript
const newUser = await UserModel.create({
  name: 'John Doe',
  age: 30,
  email: 'john@example.com'
});
console.log(newUser); // { id: '...', name: 'John Doe', age: 30, email: 'john@example.com' }
```

### Read

To find a document by ID:

```javascript
const user = await UserModel.findById('some-uuid');
console.log(user);
```

To find multiple documents:

```javascript
const users = await UserModel.find({ age: { $gte: 18 } });
console.log(users);
```

To find a single document:

```javascript
const user = await UserModel.findOne({ email: 'john@example.com' });
console.log(user);
```

### Update

To update a single document:

```javascript
const updated = await UserModel.updateOne(
  { email: 'john@example.com' },
  { age: 31 }
);
console.log(updated); // true if a document was updated, false otherwise
```

To update multiple documents:

```javascript
const result = await UserModel.updateMany(
  { age: { $lt: 18 } },
  { status: 'minor' }
);
console.log(result.modifiedCount);
```

### Delete

To delete a single document:

```javascript
const deleted = await UserModel.deleteOne({ email: 'john@example.com' });
console.log(deleted); // true if a document was deleted, false otherwise
```

To delete multiple documents:

```javascript
const result = await UserModel.deleteMany({ age: { $lt: 18 } });
console.log(result.deletedCount);
```

## Query Operations

The `find` method supports various query operations:

```javascript
// Greater than
const adultsOnly = await UserModel.find({ age: { $gt: 18 } });

// Greater than or equal to
const adultsAndTeens = await UserModel.find({ age: { $gte: 13 } });

// Less than
const minors = await UserModel.find({ age: { $lt: 18 } });

// Less than or equal to
const notSeniors = await UserModel.find({ age: { $lte: 65 } });

// Not equal to
const notJohn = await UserModel.find({ name: { $ne: 'John' } });

// In array
const specificAges = await UserModel.find({ age: { $in: [20, 30, 40] } });
```

You can also use options for pagination and sorting:

```javascript
const options = {
  limit: 10,
  skip: 20,
  sort: 'age:desc'
};

const users = await UserModel.find({}, options);
```

## Count Documents

To count documents matching a query:

```javascript
const adultCount = await UserModel.countDocuments({ age: { $gte: 18 } });
console.log(adultCount);
```

## Error Handling

The `RedisModel` will throw errors for invalid data types. Always use try-catch blocks:

```javascript
try {
  await UserModel.create({ name: 'John', age: '30' }); // This will throw an error
} catch (error) {
  console.error('Error creating user:', error.message);
}
```

Remember to handle potential Redis connection errors as well.

---

This guide covers the basic usage of the `RedisModel` class. For more advanced use cases or specific Redis operations not covered by this model, you may need to extend the class or use the Redis client directly.