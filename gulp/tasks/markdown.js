import gulp from 'gulp';
import gutil from 'gulp-util';
import fs from 'fs';
import path from 'path';
import frontmatter from 'front-matter';
import showdown from 'showdown';
import config from '../config';
import reload from '../util/reload';
import CodePreview from '../plugins/gulp-code-preview';
import gulpLoadPlugins from 'gulp-load-plugins';

const $ = gulpLoadPlugins();


gulp.task('markdown', ['layouts'], () => {
  const markdown = new showdown.Converter({
    // Valid showdown options can be found:
    // https://github.com/showdownjs/showdown#valid-options

    // Provides GitHub style header IDs which are hyphenated when the header is
    // separated by spaces
    ghCompatibleHeaderId: true
  })
  var building = process.env.build === 'true';
  var meta = { title: 'Style Guide' };
  var previews = new CodePreview(config.previews);

  return gulp.src(config.src.glob('markdown'))
    .pipe(previews.extract())
    .pipe($.data(function(file) {
      var content = frontmatter(String(file.contents));
      var filename = path.join(config.tmp.path('layouts'), (content.layout || 'main') + '.hb');
      var layout = fs.readFileSync(filename);
      var result = markdown.makeHtml(content.body)
      content.attributes['contents'] = result;
      file.contents = new Buffer(layout);
      return content.attributes;
    }))

    .pipe($.compileHandlebars(meta, config.handlebars.options))
    .pipe($.extReplace('.html'))

    .pipe(previews.write())

    .pipe(gulp.dest(config.tmp.path('markdown')))
    .pipe($.if(building, gulp.dest(config.dest.path('markdown'))))

    .on('finish', () => {
      previews.files()
        .pipe(gulp.dest(config.tmp.path('markdown')))
        .pipe($.if(building, gulp.dest(config.dest.path('markdown'))))
      ;
    })

    .pipe(reload())
  ;
});
