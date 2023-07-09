const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)

const Blog = require('../models/blog')
const User = require('../models/user')

const helper = require('./test_helper')
const bcrypt = require('bcrypt')

describe('when there initially some blog post saved and one user', () => {
    beforeEach(async () => {
        //Add root user
        await User.deleteMany({})
        const passwordHash = await bcrypt.hash('sekret', 10)
        const user = new User({ username: 'root', passwordHash, name: 'Superuser' })
        await user.save()

        //add root user._id as user field in all blogs
        const initialBlogs = helper.initialBlogs.map(b => {
            return { ...b, user: user._id }
        })

        await Blog.deleteMany({})
        await Blog.insertMany(initialBlogs)

    }, 100000)

    test('blog posts are returned as JSON', async () => {
        await api
            .get('/api/blogs')
            .expect(200)
            .expect('Content-Type', /application\/json/)

    })

    test('the correct amount of blog posts is returned', async () => {
        const response = await api.get('/api/blogs')
        expect(response.body).toHaveLength(helper.initialBlogs.length)
    })

    describe('addition of a new blog post', () => {
        test('post requests creates a new blog post', async () => {
            const token = await helper.obtainRootToken()

            const newBlog = {
                title: 'Test Blog Article',
                author: 'John Doe',
                url: 'www.test.com',
                likes: 5
            }

            await api
                .post('/api/blogs')
                .set('Authorization', `Bearer ${token}`)
                .send(newBlog)
                .expect(201)
                .expect('Content-Type', /application\/json/)

            const blogsAtEnd = await helper.blogsInDb()
            expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

            const contents = blogsAtEnd.map(b => b.title)
            expect(contents).toContain(newBlog.title)
        })

        test('adding a blog fails with status code 401 if status code is not provided', async () => {
            const newBlog = {
                title: 'Test Blog Article',
                author: 'John Doe',
                url: 'www.test.com',
                likes: 5
            }

            await api
                .post('/api/blogs')
                .send(newBlog)
                .expect(401)
                .expect('Content-Type', /application\/json/)

            const blogsAtEnd = await helper.blogsInDb()
            expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
        })

        test('like property defaults to 0 if missing', async () => {
            const token = await helper.obtainRootToken()

            const newBlog = {
                title: 'Test Blog Article',
                author: 'John Doe',
                url: 'www.test.com'
            }

            const response = await api
                .post('/api/blogs')
                .set('Authorization', `Bearer ${token}`)
                .send(newBlog)
                .expect(201)
                .expect('Content-Type', /application\/json/)

            expect(response.body.likes).toBe(0)
        })

        test('return status code 400 if title or url is missing', async () => {
            const token = await helper.obtainRootToken()

            const newBlog = {
                title: 'Test Blog Article',
                author: 'John Doe',
                url: 'www.test.com',
                likes: 5
            }

            const blogMissingTitle = {
                author: newBlog.author,
                url: newBlog.url,
                likes: newBlog.likes
            }
            const blogMissingUrl = {
                title: newBlog.title,
                author: newBlog.author,
                likes: newBlog.likes
            }

            await api
                .post('/api/blogs')
                .set('Authorization', `Bearer ${token}`)
                .send(blogMissingTitle)
                .expect(400)
                .expect('Content-Type', /application\/json/)

            await api
                .post('/api/blogs')
                .set('Authorization', `Bearer ${token}`)
                .send(blogMissingUrl)
                .expect(400)
                .expect('Content-Type', /application\/json/)
        })
    })

    describe('deletion of a blog post', () => {
        test('deleting a single resource', async () => {
            const token = await helper.obtainRootToken()

            const blogsAtStart = await helper.blogsInDb()
            const blogToDelete = blogsAtStart[0]
            await api
                .delete(`/api/blogs/${blogToDelete.id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(204)

            const blogsAtEnd = await helper.blogsInDb()
            expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1)

            const contents = blogsAtEnd.map(b => b.title)
            expect(contents).not.toContain(blogToDelete.title)
        })
    })

    describe('updating a blog post', () => {
        test('updating information of an individual blog post', async () => {
            const token = await helper.obtainRootToken()

            const blogsAtStart = await helper.blogsInDb()
            const blogToUpdate = blogsAtStart[0]

            const updatedContent = {
                title: blogToUpdate.title,
                author: blogToUpdate.name,
                url: blogToUpdate.url,
                likes: 69
            }

            const response = await api
                .put(`/api/blogs/${blogToUpdate.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send(updatedContent)
                .expect(200)
                .expect('Content-Type', /application\/json/)


            const blogsAtEnd = await helper.blogsInDb()
            expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
            expect(response.body.likes).toBe(69)
        })
    })
})

describe('when there is initially one user in db', () => {
    beforeEach(async () => {
        await User.deleteMany({})

        const passwordHash = await bcrypt.hash('sekret', 10)
        const user = new User({ username: 'root', passwordHash, name: 'Superuser' })

        await user.save()
    }, 100000)

    test('see all users', async () => {
        const usersAtStart = await helper.usersInDb()
        const response = await api
            .get('/api/users')
            .expect(200)
            .expect('Content-Type', /application\/json/)
        expect(response.body).toHaveLength(usersAtStart.length)
    })

    describe('user creation', () => {
        test('create new user works', async () => {
            const usersAtStart = await helper.usersInDb()
            const newUser = {
                username: 'mluukai',
                name: 'Matti Luukkainen',
                password: 'salainen'
            }
            await api
                .post('/api/users')
                .send(newUser)
                .expect(201)
                .expect('Content-Type', /application\/json/)
            const usersAtEnd = await helper.usersInDb()
            expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

            const usernames = usersAtEnd.map(u => u.username)
            expect(usernames).toContain(newUser.username)
        })

        test('username must be unique', async () => {
            const usersAtStart = await helper.usersInDb()
            const newUser = {
                username: 'root',
                name: 'superuser',
                password: 'salainen'
            }
            const response = await api
                .post('/api/users')
                .send(newUser)
                .expect(400)
                .expect('Content-Type', /application\/json/)

            expect(response.body.error).toContain('expected `username` to be unique')
            const usersAtEnd = await helper.usersInDb()
            expect(usersAtEnd).toEqual(usersAtStart)
        })

        test('username must be at three characters', async () => {
            const usersAtStart = await helper.usersInDb()
            const newUser = {
                username: 'ja',
                name: 'Jane Roe',
                password: 'salainen'
            }
            const response = await api
                .post('/api/users')
                .send(newUser)
                .expect(400)
                .expect('Content-Type', /application\/json/)

            expect(response.body.error).toContain('`username` (`ja`) is shorter than the minimum allowed length')
            const usersAtEnd = await helper.usersInDb()
            expect(usersAtEnd).toEqual(usersAtStart)
        })

        test('password must be at three characters', async () => {
            const usersAtStart = await helper.usersInDb()
            const newUser = {
                username: 'janeroe',
                name: 'Jane Roe',
                password: 'sa'
            }
            const response = await api
                .post('/api/users')
                .send(newUser)
                .expect(400)
                .expect('Content-Type', /application\/json/)

            expect(response.body.error).toContain('password must be at least 3 characters')
            const usersAtEnd = await helper.usersInDb()
            expect(usersAtEnd).toEqual(usersAtStart)
        })

    })

    describe('token authentication', () => {
        test('returns token with valid username and password', async () => {
            const usersInDb = await helper.usersInDb()
            const loginDetails = {
                username: 'root',
                password: 'sekret'
            }
            const response = await api
                .post('/api/login')
                .send(loginDetails)
                .expect(200)
                .expect('Content-Type', /application\/json/)
            const usernames = usersInDb.map(u => u.username)
            expect(usernames).toContain(response.body.username)
        })

        test('token authentication fails with invalid username', async () => {
            const loginDetails = {
                username: 'wrong',
                password: 'wrong'
            }
            const response = await api
                .post('/api/login')
                .send(loginDetails)
                .expect(401)
                .expect('Content-Type', /application\/json/)

            expect(response.body.error).toContain('invalid username or password')

        })

        test('token authentication fails with invalid password', async () => {
            const loginDetails = {
                username: 'root',
                password: 'wrong'
            }
            const response = await api
                .post('/api/login')
                .send(loginDetails)
                .expect(401)
                .expect('Content-Type', /application\/json/)

            expect(response.body.error).toContain('invalid username or password')

        })
    })

})


afterAll(async () => {
    await mongoose.connection.close()
})