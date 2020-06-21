const {src, dest, series, parallel, watch} = require('gulp');

const babel = require('gulp-babel');

const sass = require('gulp-sass');

const swig = require('gulp-swig');

const browserSync = require('browser-sync');

// 创建一个开发服务器
const bs = browserSync.create();

// const plugins.imagemin = require('gulp-imagemin');

const loadPlugins = require('gulp-load-plugins');
const plugins = loadPlugins();
// 之后可以通过plguns[plugin name] 来使用自动加载的插件

const del = require('del');
// 清除文件
const clean = () => {
    return del(['dist', 'temp']);
}

// public 下的静态文件直接拷贝
const extra = () => {
    return src('public/**', {base: 'public'})
        .pipe(dest('dist'))
}

const image = () => {
    return src('src/assets/images/**', {base: 'src'})
        .pipe(plugins.imagemin())
        .pipe(dest('dist'))
}

// 字体文件不需要特殊处理，只是里边的svg同样可以借助imagemin 来压缩
const font = () => {
    return src('src/assets/fonts/**', {base: 'src'})
        .pipe(plugins.imagemin())
        .pipe(dest('dist'))
}



const pagedata = {
    pkg: require('./package.json'),
    data: new Date(),
    menus: [
        {
            name: 'Home',
            icon: 'aperture',
            link: 'index.html',
        },
        {
            name: 'Features',
            link: 'features.html',
        },
        {
            name: 'About',
            link: 'about.html',
        },
        {
            name: 'Contact',
            link: '#',
            children: [
                {
                    name: 'Twitter',
                    link: 'https://baidu.com',
                },
                {
                    name: 'Twitter',
                    link: 'https://baidu.com',
                },
                {
                    name: 'Twitter',
                    link: 'https://baidu.com',
                },
            ]
        }
    ]
}

const page = () => {
    return src('src/**/*.html', {base: 'src'}) // src 下任意子目录下的任意html文件
        .pipe(swig({data: pagedata, defaults: { cache: false }}))
        .pipe(dest('temp'))
        .pipe(bs.reload({stream: true})) 
}

const style = () => {
    return src('src/assets/styles/*.scss', {base: 'src'}) // base src 保留转换前的基础路径
        .pipe(sass({
            outputStyle: 'expanded', // 代表编译后大括号完全展开
        })) // 下户线开头的css 文件默认不会被转换
        .pipe(dest('temp'))
        .pipe(bs.reload({stream: true})) // 以流的方式像浏览器推送变化
}

const script = () => {
    return src('src/assets/scripts/*.js', {
        base: 'src'
    })
        .pipe(babel({
            presets: ['@babel/preset-env']
        }))
        .pipe(dest('temp'))
        .pipe(bs.reload({stream: true})) 
}



const serve = () => {
    // 监听源代码自动编译
    watch('src/assets/styles/*.scss', style);
    watch('src/assets/scripts/*.js', script);
    watch('src/*.html', page);
    watch([
        'src/assets/images/**',
        'src/assets/fonts/**',
        'public/**'
    ], bs.reload);
    

    bs.init({
        notify: false, // 打开浏览器后，右上角不再显示连接成功的提示
        port: 2080,
        open: true,
        // files: 'dist/**', // 监听dist下的文件变化
        server: {
            // baseDir: 'dist',
            baseDir: ['temp', 'src', 'public'], // 指定为数组 时开发环境会一次从数组中的目录寻找文件，这种方式可以避免在开发环境打包静态资源，从而提升开发构建速度
            routes: {
                '/node_modules': 'node_modules' 
            }
        }
    })
}

const useref = () => {
    return src('temp/**/*.html', {base: 'temp'})
        .pipe(plugins.useref({searchPath: ['temp', '.']}))
        .pipe(plugins.if(/\.js$/, plugins.uglify()))
        .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
        .pipe(plugins.if(/\.html$/, plugins.htmlmin({
            collapseWhitespace: true, // 压缩html
            minifyCSS: true, // 压缩行内css
            minifyJS: true, // 压缩行内js
        })))
        .pipe(dest('dist'))
}





// 组合任务
const compile = parallel(style, script, page);

// const build = series( clean, parallel(compile, extra) );


const build = series(
    clean,
    parallel(
        series( compile, useref),
        image,
        font,
        extra
    )
)

const devlop = series(compile, serve);

module.exports = {
    style,
    clean,
    script,
    page,
    compile,
    image,
    font,
    build,
    serve,
    extra,
    devlop,
    useref,
}