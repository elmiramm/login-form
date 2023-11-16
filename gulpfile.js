import gulp from "gulp";
import { deleteAsync } from "del"; //удаление папки dist
import fileInclude from "gulp-file-include"; // html: Включение участков кода в файл html и разделение кода на более мелкие блоки
import gulpVersionNumber from "gulp-version-number";
import replace from "gulp-replace"; //Поиск и замена
import webpHtmlNosvg from "gulp-webp-html-nosvg"; // html: находит в html теги картинок и заменяет их в теги с форматом webp
import plumber from "gulp-plumber"; //Обработка ошибок 
import notify from "gulp-notify"; // Сообщения при ошибке
import browsersync from "browser-sync"; // Локальный сервер
import dartSass from 'sass';
import gulpSass from 'gulp-sass';
import rename from 'gulp-rename';
import cleanCss from 'gulp-clean-css'; // Сжатие css файла
import webpcss from 'gulp-webpcss'; // Вывод webp изображений 
import autoprefixer from 'gulp-autoprefixer'; // Добавление вендорных префиксов
import groupCssMediaQueries from 'gulp-group-css-media-queries'; // Группировка медиа-запросов
import webpack from "webpack-stream";
import webp from "gulp-webp";
import imagemin from "gulp-imagemin";
import newer from "gulp-newer"; //Проверка обновлений 
import fs from 'fs';
import fonter from 'gulp-fonter';
import ttf2woff2 from 'gulp-ttf2woff2';
import svgSprite from 'gulp-svg-sprite';
import ifPlugins from "gulp-if" //Условное ветвление 
import zipPlugin from "gulp-zip";



//Получение имени проекта
import * as nodePath from 'path';
const rootFolder = nodePath.basename(nodePath.resolve());

const sass = gulpSass(dartSass);

const buildFolder = `./docs`; //или: const buildFolder = `./${rootFolder}`
const srcFolder = `./src`;

const isBuild = process.argv.includes('--build');
const isDev = !process.argv.includes('--build');

const path = {
	build: {
		html: `${buildFolder}/`,
		css: `${buildFolder}/css/`,
		js: `${buildFolder}/js/`,
		images: `${buildFolder}/img/`,
		fonts: `${buildFolder}/fonts/`
	},
	src: {
		html: `${srcFolder}/*.html`,
		scss: `${srcFolder}/scss/style.scss`,
		js: `${srcFolder}/js/app.js`,
		images: `${srcFolder}/img/**/*.{jpg,jpeg,png,gif,webp,avif}`,
		svg: `${srcFolder}/img/**/*.svg`,
		svgicons: `${srcFolder}/svgicons/*.svg`,
	},
	watch: {
		html: `${srcFolder}/**/*.html`,
		scss: `${srcFolder}/scss/**/*.scss`,
		js: `${srcFolder}/js/**/*.js`,
		images: `${srcFolder}/img/**/*.{jpg,jpeg,png,svg,gif,ico,webp,avif}`
	},
	clean: buildFolder
}

function cleanDist() {
	return deleteAsync(path.clean);
}

function html() {
	return gulp.src(path.src.html)
		.pipe(plumber(
			notify.onError({
				title: 'HTML',
				message: "Error: <%= error.message %>"
			})
		))
		.pipe(fileInclude())
		.pipe(replace(/@img\//g, "img/"))
		.pipe(ifPlugins(isBuild, webpHtmlNosvg()))
		.pipe(ifPlugins(isBuild, gulpVersionNumber({
			'value': '%DT%',
			'append': {
				'key': '_v',
				'cover': 0,
				'to': [
					'css',
					'js',
				]
			},
			'output': {
				'file': 'version.json'
			}
		})))
		.pipe(gulp.dest(path.build.html))
		.pipe(browsersync.stream())
}

function scss() {
	return gulp.src(path.src.scss, { sourcemaps: isDev })
		.pipe(plumber(
			notify.onError({
				title: 'SCSS',
				message: "Error: <%= error.message %>"
			})
		))
		.pipe(replace(/@img\//g, "../img/"))
		.pipe(sass({
			outputStyle: 'expanded'
		}))
		.pipe(ifPlugins(isBuild, groupCssMediaQueries()))
		.pipe(ifPlugins(isBuild, webpcss({
			webpClass: ".webp",
			noWebpClass: ".no-webp"
		})))
		.pipe(ifPlugins(isBuild, autoprefixer({
			grid: true,
			overrideBrowserslist: ["last 3 versions"],
			cascade: true
		})))
		.pipe(ifPlugins(isBuild, gulp.dest(path.build.css))) //если нужен не сжатый формат css-файла в папке dist 
		.pipe(ifPlugins(isBuild, cleanCss()))
		.pipe(rename({
			extname: ".min.css"
		}))
		.pipe(gulp.dest(path.build.css))
		.pipe(browsersync.stream());
}

function js() {
	return gulp.src(path.src.js, { sourcemaps: isDev })
		.pipe(plumber(
			notify.onError({
				title: 'JS',
				message: "Error: <%= error.message %>"
			})
		))
		.pipe(webpack({
			entry: ['@babel/polyfill', './src/js/app.js'],
			mode: isBuild
				? "production"
				: "development",
			output: {
				filename: "app.min.js"
			},
			module: {
				rules: [
					{
						test: /\.m?js$/,
						exclude: /node_modules/,

						use: {
							loader: 'babel-loader',
							options: {
								presets: ['@babel/preset-env'],
							},
						},

						resolve: {
							fullySpecified: false,
						},
					},
				],
			}
		}))
		.pipe(gulp.dest(path.build.html))
		.pipe(browsersync.stream())
}

function images() {
	return gulp.src(path.src.images)
		.pipe(plumber(
			notify.onError({
				title: '	IMAGES',
				message: "Error: <%= error.message %>",
			}
			)))
		.pipe(newer(path.build.images))
		.pipe(ifPlugins(isBuild, webp()))
		.pipe(ifPlugins(isBuild, gulp.dest(path.build.images)))

		.pipe(ifPlugins(isBuild, gulp.src(path.src.images)))
		.pipe(ifPlugins(isBuild, newer(path.build.images)))
		.pipe(ifPlugins(isBuild, imagemin({
			progressive: true,
			svgoPlugins: [{ removeViewBox: false }],
			interlaced: true,
			optimizationLevel: 3,
		})))
		.pipe(gulp.dest(path.build.images))

		.pipe(gulp.src(path.src.svg))
		.pipe(gulp.dest(path.build.images))

		.pipe(browsersync.stream());
}

function fonts() {
	return gulp.src(`${srcFolder}/fonts/*.otf`, {})
		.pipe(plumber(
			notify.onError({
				title: "FONTS",
				message: "Error: <%= error.message %>",
			}))
		)
		.pipe(fonter({
			formats: ['ttf']
		}))
		.pipe(gulp.dest(`${srcFolder}/fonts/`))

		.pipe(gulp.src(`${srcFolder}/fonts/*.ttf`, {}))
		.pipe(plumber(
			notify.onError({
				title: "FONTS",
				message: "Error: <%= error.message %>",
			}))
		)
		.pipe(fonter({
			formats: ['woff']
		}))
		.pipe(gulp.dest(`${path.build.fonts}`))

		.pipe(gulp.src(`${srcFolder}/fonts/*.ttf`))
		.pipe(ttf2woff2())
		.pipe(gulp.dest(`${path.build.fonts}`));
}

function createFontsScss() {
	let fontsFile = `${srcFolder}/scss/fonts.scss`;

	fs.readdir(path.build.fonts, function (err, fontsFiles) {
		if (fontsFiles) {

			if (!fs.existsSync(fontsFile)) {
				fs.writeFile(fontsFile, '', cb);
				let newFileOnly;
				for (let i = 0; i < fontsFiles.length; i++) {
					let fontFileName = fontsFiles[i].split('.')[0];
					if (newFileOnly !== fontFileName && fontsFiles[i].split('.')[1] !== 'woff') {
						let fontName = fontFileName.split('-')[0] ? fontFileName.split('-')[0] : fontFileName;
						let fontWeight = fontFileName.split('-')[1] ? fontFileName.split('-')[1] : fontFileName;
						if (fontWeight.toLowerCase() === 'thin') {
							fontWeight = 100;
						} else if (fontWeight.toLowerCase() === 'extralight') {
							fontWeight = 200;
						} else if (fontWeight.toLowerCase() === 'light') {
							fontWeight = 300;
						} else if (fontWeight.toLowerCase() === 'medium') {
							fontWeight = 500;
						} else if (fontWeight.toLowerCase() === 'semibold') {
							fontWeight = 600;
						} else if (fontWeight.toLowerCase() === 'bold') {
							fontWeight = 700;
						} else if (fontWeight.toLowerCase() === 'extrabold') {
							fontWeight = 800;
						} else if (fontWeight.toLowerCase() === 'black') {
							fontWeight = 900;
						} else {
							fontWeight = 400;
						}
						fs.appendFile(fontsFile, `@font-face {\n\tfont-family: ${fontName};\n\tfont-display: swap;\n\tsrc: url("../fonts/${fontFileName}.woff2") format("woff2"), url("../fonts/${fontFileName}.woff") format("woff");\n\tfont-weight: ${fontWeight};\n\tfont-style: normal;\n}\r\n`, cb);
					}
				}
			} else {
				console.log('Файл scss/fonts.scss уже существует. Для обновления файла нужно его удалить')
			}
		}
	});

	return gulp.src(`${srcFolder}`);
	function cb() { }
}
function svgsprite() {
	return gulp.src(`${path.src.svgicons}`, {})
		.pipe(plumber(
			notify.onError({
				title: 'SVG',
				message: "Error: <%= error.message %>",
			}
			)))
		.pipe(svgSprite({
			mode: {
				stack: {
					sprite: `../icons/icons.svg`,
					example: true,
				}
			}
		}))
		.pipe(gulp.dest(path.build.images))
}

function watcher() {
	gulp.watch(path.watch.html, html);
	gulp.watch(path.watch.scss, scss);
	gulp.watch(path.watch.js, js);
	gulp.watch(path.watch.images, images);
}

function server() {
	browsersync.init({
		server: {
			baseDir: `${path.build.html}`
		},
		notify: false,
		port: 3000
	});
}

function zip() {
	deleteAsync(`./${rootFolder}.zip`);
	return gulp.src(`${buildFolder}/**/**.*`, {})
		.pipe(plumber(
			notify.onError({
				title: 'ZIP',
				message: "Error: <%= error.message %>"
			}
			)))
		.pipe(zipPlugin(`${rootFolder}.zip`))
		.pipe(gulp.dest('./'))
}


//Построение сценария выполнения задач
const dev = gulp.series(cleanDist, fonts, createFontsScss, gulp.parallel(html, scss, js, images), gulp.parallel(watcher, server));
const build = gulp.series(cleanDist, fonts, createFontsScss, gulp.parallel(html, scss, js, images));
const deployZip = gulp.series(cleanDist, fonts, createFontsScss, gulp.parallel(html, scss, js, images), zip);

export { dev }; //npm run dev - по умолчанию тоже этот скрипт
export { svgsprite }; //npm run svgsprite
export { build }; //npm run build
export { deployZip }; //npm run zip

// Выполнение сценария по умолчанию
gulp.task('default', dev); // gulp 