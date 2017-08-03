/* gulpfile.js */
var gulp = require('gulp');
var sass = require('gulp-sass');
var notify = require("gulp-notify");
var browserSync = require("browser-sync").create();
var gulpImport = require("gulp-html-import");
var tap = require("gulp-tap");
var browserify = require("browserify");
var buffer = require("gulp-buffer");
var sourcemaps = require("gulp-sourcemaps");
var htmlmin = require("gulp-htmlmin");
var uglify = require("gulp-uglify");
var postcss = require("gulp-postcss");
var autoprefixer = require("autoprefixer");
var cssnano = require("cssnano");
var concat = require("gulp-concat");

// source and distribution folder
var
    source = 'src/',
    dest = 'dist/';

// default task
gulp.task('default', ["html","js", "sass"], function () {
    // iniciamos el servidor de desarrollo
    browserSync.init({ 
        server: "dist/"
    });
    
    gulp.watch(scss.watch, ['sass']);

    // observa cambios en los archivos HTML y entonces ejecuta la tarea 'html'
    gulp.watch(["src/**/*.html"], ["html"]);

    // observa cambios en los archivos JS y entonces ejecuta la tarea 'js'
    gulp.watch(["src/js/*.js"], ["js"]);
});    
    
// Bootstrap scss source
var bootstrapSass = {
        in: './node_modules/bootstrap-sass/'
    };

// Bootstrap fonts source
var fonts = {
        in: [source + 'fonts/*.*', bootstrapSass.in + 'assets/fonts/**/*'],
        out: dest + 'fonts/'
    };

// Our scss source folder: .scss files
var scss = {
    in: source + 'scss/main.scss',
    out: dest + 'css/',
    watch: source + 'scss/**/*',
    sassOpts: {
        outputStyle: 'nested',
        precison: 3,
        errLogToConsole: true,
        includePaths: [bootstrapSass.in + 'assets/stylesheets']
    }
};
// Our scss source folder: .scss files
var js = {
    in: source + 'js/concat/concat.js',
    out: dest + 'js/'
};


// copy bootstrap required fonts to dest
gulp.task('fonts', function () {
    return gulp
        .src(fonts.in)
        .pipe(gulp.dest(fonts.out));
});

// compile scss
gulp.task('sass', ['fonts'], function () {
    return gulp.src(scss.in)
        .pipe(sass(scss.sassOpts).on("error", function(error){ // lo compilamos con gulp-sass
            return notify().write(error); // si ocurre un error, mostramos una notificación
        }))
        .pipe(postcss([
            autoprefixer(), // transforma el CSS dándole compatibilidad a versiones antiguas
            cssnano()       // comprime/minifca el CSS
        ]))
        .pipe(sourcemaps.write("./")) // guarda el sourcemap en la misma carpeta que el CSS
        .pipe(gulp.dest(scss.out))
        .pipe(browserSync.stream()) // recargue el CSS del navegador
        .pipe(notify("SASS Compilado 🤘🏻")); // muestra notifiación en pantalla
});

// concatena las librerias externas y las propias en un solo js
gulp.task("concat-js", function(){
    return gulp.src([
                    "./src/js/*.js",
                    "node_modules/bootstrap-sass/assets/javascripts/bootstrap.js",
                    "node_modules/jquery/dist/jquery.js"
                ])
               .pipe(concat('concat.js'))
               .pipe(gulp.dest('./src/js/concat/'));
});

gulp.task("js",["concat-js"],function(){
    gulp.src([
              js.in
            ])
        .pipe(tap(function(file){ // tap nos permite ejecutar una función por cada fichero seleccionado en gulp.src
            // reemplazamos el contenido del fichero por lo que nos devuelve browserify pasándole el fichero
            file.contents = browserify(file.path, {debug: true}) // creamos una instancia de browserify en base al archivo
                            .transform("babelify", {presets: ["es2015"]}) // traduce nuestro codigo de ES6 -> ES5
                            .bundle() // compilamos el archivo
                            .on("error", function(error){ // en caso de error, mostramos una notificación
                                return notify().write(error);
                            });
        }))
        .pipe(buffer()) // convertimos a buffer para que funcione el siguiente pipe
        .pipe(sourcemaps.init({loadMaps: true})) // captura los sourcemaps del archivo fuente
        .pipe(uglify()) // minificamos el JavaScript
        .pipe(sourcemaps.write('./')) // guarda los sourcemaps en el mismo directorio que el archivo fuente
        .pipe(gulp.dest(js.out)) // lo guardamos en la carpeta dist
        .pipe(browserSync.stream()) // recargamos el navegador
        .pipe(notify("JS Compilado"));
});

// copiar e importar html
gulp.task("html", function(){
    gulp.src("src/*.html")
        .pipe(gulpImport("src/components/")) // reemplaza los @import de los HTML
        .pipe(htmlmin({collapseWhitespace: true})) // minifica el HTML
        .pipe(gulp.dest("dist/"))
        .pipe(browserSync.stream())
        .pipe(notify("HTML importado"));
});

