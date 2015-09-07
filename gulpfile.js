var gulp = require('gulp'),
  opn = require('opn'),
  connect = require('gulp-connect');

gulp.task('build',function(){
  
});

gulp.task('connect', ['build'], function() {
  connect.server({
    root: 'app',
    livereload: true
  });
});

gulp.task('open', ['connect'], function(done){
  opn('http://localhost:8080', done);
});

gulp.task('html', function(){
  gulp.src('./app/*.html')
    .pipe(connect.reload());
})

gulp.task('watch', function() {
  gulp.watch('app/*.html', ['html']);
});


gulp.task('serve', ['open','watch']);

gulp.task('default', function() {
  // place code for your default task here
  console.log('YES');
});
