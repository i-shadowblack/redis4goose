const createClient = require('redis');

const RedisModel = require('../index');

// Create a new Redis client
const client = createClient.createClient();

client.connect();

// Connect to the Redis server
client.on('connect', async () => {
    console.log('Connected to Redis server');

    const UserModel = new RedisModel('user', {
        name: { type: 'string' },
        age: { type: 'number' },
        email: { type: 'string' }
    });

    // Tạo user mới
    const user = await UserModel.create({ name: 'John', age: 30, email: 'john@example.com' });
    console.log(user);

    // Tìm kiếm users
    let users = await UserModel.find({ age: { $gte: 25 } }, { sort: 'age:desc', limit: 10 });
    console.log(users);

    // Cập nhật user
    await UserModel.updateMany({ name: 'John' }, { age: 31 });

    users = await UserModel.find({ age: { $gte: 32 } }, { sort: 'age:desc', limit: 10 });
    console.log(users);
    // Xóa user
    await UserModel.deleteOne({ email: 'john@example.com' });

    // Đếm số lượng users
    const count = await UserModel.countDocuments({ age: { $lt: 40 } });
    console.log(count);
});

// Handle errors
client.on('error', (err) => {
    console.log('Error: ' + err);
});
