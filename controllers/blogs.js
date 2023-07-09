const blogsRouter = require('express').Router()
//const jwt = require('jsonwebtoken')
const Blog = require('../models/blog')
const middleware = require('../utils/middleware')
//const User = require('../models/user')

blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
    response.json(blogs)
})

blogsRouter.get('/:id', async (request, response) => {
    const blog = await Blog.findById(request.params.id).populate('user', { username: 1, name: 1 })
    if (blog) {
        response.json(blog)
    } else {
        response.status(404).end()
    }
})

blogsRouter.post('/', middleware.userExtractor, async (request, response) => {
    const body = request.body
    const user = request.user

    const blog = new Blog({
        'title': body.title,
        'author': body.author,
        'url': body.url,
        'likes': body.likes || 0,
        'user': user.id
    })

    const savedBlog = await blog.save()
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()
    response.status(201).json(savedBlog)
})

blogsRouter.delete('/:id', middleware.userExtractor, async (request, response) => {
    const user = request.user
    const blog = await Blog.findById(request.params.id)

    if (blog === null) {
        response.status(404).end()
    }

    if (blog.user.toString() === user.id.toString()) {
        await Blog.findByIdAndRemove(request.params.id)
        response.status(204).end()
    }
    response.status(401).end()

})


blogsRouter.put('/:id', middleware.userExtractor, async (request, response) => {
    const body = request.body
    const user = request.user
    const blog = await Blog.findById(request.params.id)

    if (blog === null) {
        response.status(404).end()
    }

    if (blog.user.toString() === user.id.toString()) {
        const blog = {
            'title': body.title,
            'author': body.author,
            'url': body.url,
            'likes': body.likes
        }

        const updatedNote = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
        response.json(updatedNote)
    }
    response.status(401).end()

})

module.exports = blogsRouter