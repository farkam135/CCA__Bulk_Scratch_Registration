import gulp from 'gulp';
import watch from 'gulp-watch';
import batch from 'gulp-batch';
import stylus from 'gulp-stylus';
import browserSync from 'browser-sync';
import childProcess from 'child_process';
import autoPrefixer from 'gulp-autoprefixer';

const bs = browserSync.create();
const spawn = childProcess.spawn;

let server = null;

gulp.task('stylus', (_) => {
  return gulp.src('src/stylus/**/*.styl')
    .pipe(stylus())
    .pipe(autoPrefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .pipe(gulp.dest('dist/css'))
    .pipe(bs.stream());
});

gulp.task('build', ['stylus']); // In case we want to easily add another build step

gulp.task('watch', (_) => {
  return watch('src/stylus/**/*.styl', (_) => {
    gulp.start('stylus');
  });
});

gulp.task('serve', (_) => {
  // Run the server
  server = spawn('node', ['server.js']);
  console.log('[Gulp] Spawned server...');

  // Proxy for live-reload frame
  bs.init({
    proxy: 'localhost:3000', // Default for the server during development
    port: 8080
  });
  console.log('[Gulp] Created Browser-Sync proxy...');
});

// Default to just development
gulp.task('default', ['serve', 'watch']);
