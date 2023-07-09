//const logger = require('./logger')
const _ = require('lodash')

const dummy = () => {
    return 1
}

const totalLikes = (blogs) => {
    return blogs.length === 0 ? 0
        : blogs.reduce((accumulator, blog) => {
            return accumulator + blog.likes
        }, 0)

}

const favoriteBlog = (blogs) => {
    //logger.info(blogs.sort((a, b) => a.likes < b.likes ? 1 : -1))
    const result = blogs.sort((a, b) => a.likes < b.likes ? 1 : -1)[0]
    return {
        title: result.title,
        author: result.author,
        likes: result.likes
    }
}

const mostBlogs = (blogs) => {
    const blogCounts = _.countBy(blogs, 'author')
    const authorWithMostBlogs = _.maxBy(Object.keys(blogCounts), (author) => blogCounts[author])
    //logger.info(authorWithMostBlogs, blogCounts[authorWithMostBlogs])
    //logger.info(blogCounts, Object.keys(blogCounts))
    return {
        author: authorWithMostBlogs,
        blogs: blogCounts[authorWithMostBlogs]
    }
}

const mostLikes = (blogs) => {
    // Group blogs by author and calculate total likes using _.groupBy and _.sumBy
    const likesByAuthor = _.mapValues(_.groupBy(blogs, 'author'), (authorBlogs) =>
        _.sumBy(authorBlogs, 'likes')
    )

    // Find the author with the most likes using _.maxBy
    const mostLikesAuthor = _.maxBy(_.keys(likesByAuthor), (author) => likesByAuthor[author])

    // Return the author with the most likes and the total number of likes
    return {
        author: mostLikesAuthor,
        likes: likesByAuthor[mostLikesAuthor],
    }
}

module.exports = {
    dummy, totalLikes, favoriteBlog, mostBlogs, mostLikes
}