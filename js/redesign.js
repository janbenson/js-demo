(function($) {

	var App = {

		/**
		 * Init app
		 */
		init: function() {
			App.rearrangeTables();
		},

		/**
		 * rearrange table elements
		 */
		rearrangeTables: function() {
			$('.primary-id').closest('.panel').addClass('subscriber-section');
			console.log($('.primary-id').closest('.panel'));
		},



	};




	$(function() {
		App.init();
	});




})(jQuery);