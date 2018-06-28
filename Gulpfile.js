const gulp = require('gulp');

const rollup = require('rollup-stream');
const rollupNode = require('rollup-plugin-node-resolve');

const setSource = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');

const browserSync = require('browser-sync');


let cache;

function buildJS() {
  return rollup({
    input: './src/main.mjs',
    format: 'iife',
    cache,
    sourcemap: true,
    plugins: [
      rollupNode()
    ]
  })
    .on('bundle', bundle => cache = bundle)
    .pipe(setSource('app.js'))
    .pipe(buffer())
    .pipe(gulp.dest('./dist', {sourcemaps: './'}));
}

function buildWorker() {
  return rollup({
    input: './src/worker.mjs',
    format: 'iife',
    cache,
    sourcemap: true,
    plugins: [
      rollupNode()
    ]
  })
    .on('bundle', bundle => cache = bundle)
    .pipe(setSource('worker.js'))
    .pipe(buffer())
    .pipe(gulp.dest('./dist', {sourcemaps: './'}));
}

function buildHTML() {
  return gulp.src("./src/index.html")
    .pipe(gulp.dest("./dist/"));
}

function buildCSS() {
  return gulp.src("./src/**/*.css")
    .pipe(gulp.dest("./dist/"));
}

function copyAssets() {
  return gulp.src("./src/assets/**/*")
    .pipe(gulp.dest("./dist/assets/"));
}

function watch() {
  gulp.watch("./src/**/*.mjs", gulp.series(buildJS, buildWorker, reload));
  gulp.watch("./src/**/*.html", gulp.series(buildHTML, reload));
  gulp.watch("./src/**/*.css", gulp.series(buildCSS, reload));
  gulp.watch("./src/assets/**/*", gulp.series(copyAssets, reload));
}

function serve() {
  browserSync.init({
    server: "./dist",
    open: false,
  });
}

async function reload() {
  return browserSync.reload();
}


const child_process = require('child_process');

function throwIfDirty(done) {
  child_process.exec(`git diff-index --quiet HEAD --`, (err, stdout, stderr) => {
    if(err) {
      return done("Uncommited changes, refusing to proceed");
    }
    child_process.exec(`git ls-files --exclude-standard --others`, (err, stdout, stderr) => {
      if(stdout) {
        return done("Unstaged files, refusing to proceed");
      }
      done();
    });
  });
}

function pushToGithub(done) {
  const lastCommitMessage = child_process.execSync('git show -s --format=%B HEAD').toString();
  child_process.exec(`cd dist && git add . && git commit -m "${lastCommitMessage}" && git push`, (err, stdout, stderr) => {
    if(err && stdout.match(/nothing to commit/)) {
      console.warn("nothing changed, not pushing to github");
      return done();
    }
    console.log(stdout, stderr);
    done(err)
  });
}

gulp.task(buildJS);
gulp.task(buildHTML);
gulp.task(buildCSS);
gulp.task(buildWorker);
gulp.task(copyAssets);
gulp.task("build", gulp.parallel(buildJS, buildHTML, buildCSS, buildWorker, copyAssets));
gulp.task(watch);
gulp.task(serve);
gulp.task("dev", gulp.series("build", gulp.parallel(serve, watch)));

gulp.task("deploy", pushToGithub);
gulp.task("publish", gulp.series("build", "deploy"));