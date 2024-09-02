const Redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');

class RedisModel {
    constructor(modelName, schema) {
        this.client = new Redis();
        this.modelName = modelName;
        this.schema = schema;
    }

    async create(data) {
        const id = uuidv4();
        const key = `${this.modelName}:${id}`;
        const validatedData = this.validateData(data);
        await this.client.hmset(key, { id, ...validatedData });
        await this.client.sadd(`${this.modelName}:all`, id);
        return this.findById(id);
    }

    async findById(id) {
        const key = `${this.modelName}:${id}`;
        const data = await this.client.hgetall(key);
        return Object.keys(data).length ? data : null;
    }

    async find(query = {}, options = {}) {
        const { limit = 0, skip = 0, sort } = options;
        const allIds = await this.client.smembers(`${this.modelName}:all`);
        let result = [];

        for (const id of allIds) {
            const data = await this.findById(id);
            if (this.matchQuery(data, query)) {
                result.push(data);
            }
        }

        if (sort) {
            const [field, order] = sort.split(':');
            result.sort((a, b) => {
                return order === 'desc' ? b[field] - a[field] : a[field] - b[field];
            });
        }

        return result.slice(skip, skip + limit || undefined);
    }

    async findOne(query) {
        const result = await this.find(query, { limit: 1 });
        return result[0] || null;
    }

    async updateOne(query, update) {
        const doc = await this.findOne(query);
        if (doc) {
            const key = `${this.modelName}:${doc.id}`;
            const validatedUpdate = this.validateData(update);
            await this.client.hmset(key, validatedUpdate);
            return true;
        }
        return false;
    }

    async updateMany(query, update) {
        const docs = await this.find(query);
        const updatePromises = docs.map(doc =>
            this.client.hmset(`${this.modelName}:${doc.id}`, this.validateData(update))
        );
        await Promise.all(updatePromises);
        return { modifiedCount: docs.length };
    }

    async deleteOne(query) {
        const doc = await this.findOne(query);
        if (doc) {
            const key = `${this.modelName}:${doc.id}`;
            await this.client.del(key);
            await this.client.srem(`${this.modelName}:all`, doc.id);
            return true;
        }
        return false;
    }

    async deleteMany(query) {
        const docs = await this.find(query);
        const deletePromises = docs.map(doc => {
            const key = `${this.modelName}:${doc.id}`;
            return Promise.all([
                this.client.del(key),
                this.client.srem(`${this.modelName}:all`, doc.id)
            ]);
        });
        await Promise.all(deletePromises);
        return { deletedCount: docs.length };
    }

    async countDocuments(query = {}) {
        const docs = await this.find(query);
        return docs.length;
    }

    validateData(data) {
        const validated = {};
        for (const [field, value] of Object.entries(data)) {
            if (this.schema[field]) {
                if (typeof value !== this.schema[field].type) {
                    throw new Error(`Invalid type for field ${field}`);
                }
                validated[field] = value;
            }
        }
        return validated;
    }

    matchQuery(doc, query) {
        return Object.entries(query).every(([key, value]) => {
            if (typeof value === 'object') {
                if ('$gt' in value) return doc[key] > value.$gt;
                if ('$gte' in value) return doc[key] >= value.$gte;
                if ('$lt' in value) return doc[key] < value.$lt;
                if ('$lte' in value) return doc[key] <= value.$lte;
                if ('$ne' in value) return doc[key] !== value.$ne;
                if ('$in' in value) return value.$in.includes(doc[key]);
            }
            return doc[key] === value;
        });
    }
}

module.exports = RedisModel;