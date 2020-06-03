$(document).ready(function() {
  'use strict';

  var headerOverlay = $(".header__overlay"),
    menuOpenIcon = $(".nav__icon-menu"),
    menuCloseIcon = $(".ion-md-close"),
    menuBox = $(".main-nav__box"),
    searchOpenIcon = $(".nav__icon-search"),
    searchCloseIcon = $(".search__close"),
    searchBox = $(".search");

  /* =======================
  // Animation Load Page
  ======================= */
  setTimeout(function () {
    $('body').addClass('is-in');
  }, 100)

  /* =======================
  // Menu and Search
  ======================= */
  menuOpenIcon.click(function() {
    menuOpen();
  })

  menuCloseIcon.click(function () {
    menuClose();
  })

  searchOpenIcon.click(function () {
    searchOpen();
  });

  searchCloseIcon.click(function () {
    searchClose();
  });

  headerOverlay.click(function () {
    menuClose();
    searchClose();
  });

  function menuOpen() {
    menuBox.addClass("is-open");
    headerOverlay.addClass("is-visible");
  }

  function menuClose() {
    menuBox.removeClass("is-open");
    headerOverlay.removeClass("is-visible");
  }

  function searchOpen() {
    searchBox.addClass("is-visible");
  }

  function searchClose() {
    searchBox.removeClass("is-visible");
  }

  /* =======================
  // Slick Slider
  ======================= */
  $('.slider__box').slick({
    infinite: true,
    autoplay: true,
    autoplaySpeed: 8000,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    prevArrow: $('.slider__nav-prev'),
    nextArrow: $('.slider__nav-next'),
    dots: false,
    centerMode: true,
    adaptiveHeight: true,
    fade: true,
    cssEase: 'linear',
    responsive: [
      {
        breakpoint: 768,
        settings: {
          dots: false,
          arrows: true
        }
      }
    ]
  });

  /* =======================
  // Masonry Grid Layout
  ======================= */
  var $grid = $('.grid').masonry({
    itemSelector: '.grid__post',
    percentPosition: true
  });

  $grid.imagesLoaded().progress(function () {
    $grid.masonry('layout');
  });

  // =====================
  // Ajax Load More
  // =====================
  var $load_posts_button = $('.load-more');

  $load_posts_button.click(function (e) {
    e.preventDefault();
    var loadMore = $('.pagination');
    var request_next_link = pagination_next_url.split('/page')[0] + '/page/' + pagination_next_page_number + '/';

    $.ajax({
      url: request_next_link,
      beforeSend: function () {
        $load_posts_button.text('Loading...');
      }
    }).done(function (data) {
      var posts = $('.grid__post', data);
      $('.grid').append(posts).masonry('appended', posts);
      $grid.imagesLoaded().progress(function () {
        $grid.masonry('layout');
      });

      $load_posts_button.text('Load more ').append('<i class="ion ion-ios-arrow-down"></i>');
      pagination_next_page_number++;

      if (pagination_next_page_number > pagination_available_pages_number) {
        loadMore.addClass('hide');
      }
    });
  });


  /* =======================
  // Responsive Videos
  ======================= */
  $(".post__content, .page__content").fitVids({
    customSelector: ['iframe[src*="ted.com"]', 'iframe[src*="facebook.com"]']
  });

  /* =======================
  // Zoom Image
  ======================= */
  $(".page img, .post img").attr("data-action", "zoom");
  $(".page a img, .post a img").removeAttr("data-action", "zoom");


  /* =======================
  // Instagram Feed
  ======================= */
  var userId = $('#instafeed').attr('data-userId');
  var accessToken = $('#instafeed').attr('data-accessToken');
  var instagramFeed = new Instafeed({
    get: 'user',
    limit: 6,
    resolution: 'standard_resolution',
    userId: userId,
    accessToken: accessToken,
    template:
      '<li class="instagram-item"><a href="{{link}}" class="instagram-link" aria-label="{{caption}}" target="_blank"><img src="{{image}}" alt="{{caption}}"></a></li>'
  });

  if ($('#instafeed').length) {
    instagramFeed.run();
  }

  /* =======================
  // Scroll Top Button
  ======================= */
  $(".top").click(function() {
    $("html, body")
      .stop()
      .animate({ scrollTop: 0 }, "slow", "swing");
  });
  $(window).scroll(function() {
    if ($(this).scrollTop() > $(window).height()) {
      $(".top").addClass("is-active");
    } else {
      $(".top").removeClass("is-active");
    }
  });

});