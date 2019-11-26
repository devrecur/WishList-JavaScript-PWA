(function () {
	'use strict';

	let categorySelectEle = null;
	let subCategorySelectEle = null;
	let storeSelectEle = null;
	let searchBoxEle = null;
	let navbarFixedEle = null;
	let searchBtnEle = null;

	let groupByCategory,
		groupBySubCategory,
		groupByStore,
		allData,
		rawData,
		startIndex = 0,
		lastIndex = 20,
		chunk = 20;

	let favListIds = [],
		favList = [];

	$(document).ready(function () {
		categorySelectEle = $('select.categoryList');
		subCategorySelectEle = $('select.subCategoryList');
		storeSelectEle = $('select.storeList');
		searchBoxEle = $('#search-box');
		navbarFixedEle = $('.navbar-fixed');
		searchBtnEle = $('.search-btn');

		$('select').material_select();
		$('.button-collapse').sideNav();
		$('ul.tabs').tabs({
			swipeable: false,
			onShow: function(ct){
				console.log(ct);
				$('.tabs-content.carousel.initialized').css("height","auto");
			}
		});
	});

	window.onload = function () {

		getFavList();

		let message = localStorage.getItem("message") || 'Your message will display here';
		$('#message').html(message);
		$('#display').html(message);
	}


	// custom changes starts

	/**
	 * Loads the CSV file
	 */

	setTimeout(() => {
		loadData();
	}, 0);


	function getFavList() {
		favListIds = JSON.parse(localStorage.getItem('favListIds')) || [];
		favList = JSON.parse(localStorage.getItem('favList')) || [];
		clearFavList();
		populateFavList(favList);
	}

	function saveFavList() {
		localStorage.setItem("favListIds", JSON.stringify(favListIds));
		localStorage.setItem("favList", JSON.stringify(favList));
		getFavList();
	}

	function loadData() {

		// Get the data from our CSV file
		d3.csv('data.csv', function (error, vCsvData) {
			if (error) throw error;

			var categoriesList = [],
				subCateogiesList = [],
				storeList = [];




			allData = vCsvData;
			rawData = vCsvData;
			initalize(vCsvData);

			let options = [];
			for (let i = 0; i < allData.length; i += chunk) {
				if (i) {
					var option = {
						selector: '.collection.all .list-' + (i - 10),
						offset: 200,
						callback: function (ce) {
							console.log(ce);
							moreData();
						},
						done: false
					};
					options.push(option);
				}
			}
			Materialize.scrollFire(options);

			moreData();
			// Events
			categorySelectEle.on('change', function () {
				var selectedCategory = this.value;
				if (selectedCategory) {
					subCateogiesList = [];
					subCateogiesList = groupByCategory.find(element => {
						return element.key === selectedCategory;
					});
					clearAndPopulateList(subCateogiesList.values);

					groupBySubCategory = getDataGroupBy(subCateogiesList.values, "SubCategory");
					groupByStore = getDataGroupBy(subCateogiesList.values, "Store");

					subCateogiesList = [];
					subCateogiesList = groupBySubCategory.map(element => {
						return element.key.trim();
					});

					storeList = [];
					storeList = groupByStore.map(element => {
						return element.key;
					});

					populateSubCategorySelect(subCateogiesList);
					populateStoreSelect(storeList);
				}
			});

			subCategorySelectEle.on('change', function () {
				var selectedSubCategory = this.value;
				if (selectedSubCategory) {
					storeList = [];
					storeList = groupBySubCategory.find(element => {
						return element.key === selectedSubCategory;
					});
					clearAndPopulateList(storeList.values);
					groupByStore = getDataGroupBy(storeList.values, "Store");
					storeList = [];
					storeList = groupByStore.map(element => {
						return element.key;
					});
					populateStoreSelect(storeList);
				}
			});

			storeSelectEle.on('change', function () {
				var selectedStore = this.value;
				if (selectedStore) {
					storeList = [];
					storeList = groupByStore.find(element => {
						return element.key === selectedStore;
					});
					clearAndPopulateList(storeList.values);
				}
			});


		});
	}

	function getListItemById(list, key) {
		return list.find(element => {
			return element.Id == key;
		})
	}
	function removeFromList(list, key, identifier) {
		let index = list.findIndex(elem => {
			if (identifier)
				return elem[identifier] == key;
			else
				return elem == key;
		});
		list.splice(index, 1)
	}

	function moreData() {
		populateList(allData.slice(startIndex, lastIndex));
		startIndex += chunk;
		lastIndex += chunk;
	}

	function cardEvents() {
		// Card Events
		$('.add-to-fav').off('click');
		$('.add-to-fav').click(event => {
			console.log(event.currentTarget.dataset.id);
			let id = event.currentTarget.dataset.id || 0;
			let listItem = getListItemById(allData, id);
			if (listItem) {
				favList.push(listItem);
				favListIds.push(id);
				$('.list-' + id + ' .add-to-fav').addClass('hide');
				$('.list-' + id + ' .remove-from-fav').removeClass('hide');
				saveFavList();
			}

		});

		$('.remove-from-fav').off('click');

		$('.remove-from-fav').click(event => {
			console.log(event.currentTarget.dataset.id);
			let id = event.currentTarget.dataset.id || 0;
			if (id) {
				removeFromList(favList, id, "Id");
				removeFromList(favListIds, id);
				$('.list-' + id + ' .remove-from-fav').addClass('hide');
				$('.list-' + id + ' .add-to-fav').removeClass('hide');
				saveFavList();
			}
		});
	}

	function getALLData() {
		populateList(allData);
		startIndex = 0;
		lastIndex = chunk;
	}


	function initalize(vCsvData) {
		//	populateList(vCsvData);


		// Group by Category
		groupByCategory = getDataGroupBy(vCsvData, "Category");
		groupByStore = getDataGroupBy(vCsvData, "Store");

		let categoriesList = [];
		categoriesList = groupByCategory.map(element => {
			return element.key;
		});

		let storeList = [];
		storeList = groupByStore.map(element => {
			return element.key;
		});

		populateCategorySelect(categoriesList);
		populateStoreSelect(storeList);
	}

	function getDataGroupBy(data, field) {
		if (data && field) {
			return d3.nest()
				.key(function (d) {
					return d[field];
				})
				.entries(data);
		}
	}

	function clearAndPopulateList(data) {
		clearList();
		startIndex = 0;
		lastIndex = chunk;
		//populateList(data);
		allData = data;
		getALLData();
	}

	function populateCategorySelect(categoriesList) {

		categorySelectEle.material_select('destroy');
		categorySelectEle.html('<option value="" disabled selected>Choose your option</option>')

		categoriesList.forEach(element => {
			categorySelectEle.append(
				'<option value="' + element + '">' + element + '</option>'
			);
		});
		categorySelectEle.material_select();
	}

	function populateSubCategorySelect(subCateogiesList) {

		if (subCateogiesList.length == 0 || !subCateogiesList[0]) {
			subCategorySelectEle.hide();
			return;
		}
		subCategorySelectEle.show();

		subCategorySelectEle.material_select('destroy');
		subCategorySelectEle.html('<option value="" disabled selected>Choose your option</option>')

		subCateogiesList.forEach(element => {
			subCategorySelectEle.append(
				'<option value="' + element + '">' + element + '</option>'
			);
		})
		subCategorySelectEle.material_select();

	}

	function populateStoreSelect(storeList) {

		storeSelectEle.material_select('destroy');
		storeSelectEle.html('<option value="" disabled selected>Choose your option</option>')

		storeList.forEach(element => {
			storeSelectEle.append(
				'<option value="' + element + '">' + element + '</option>'
			);
		});
		storeSelectEle.material_select();
	}

	function populateFavList(vCsvData) {

		let collectionItemsStr = '';

		if(vCsvData.length === 0){
			collectionItemsStr += 
			'<li class="collection-header"> \
				<h6> Favorites are empty </h6>\
			</li>';
		}

		vCsvData.forEach(element => {
			if (!element.Product) return;

			collectionItemsStr +=
				'<li class="collection-item card list-' + element.Id + '"> \
					<h6 class="card-title">' + element.Product + '</h6> \
					<p>	\
						' + element.Store + ' - \
						  ' + element.Price + ' \
					</p>	\
					<p class="flow-text"> \
						' + element.Notes + '\
					</p> \
					<div class="row" style="margin-bottom:0"> \
						<div class="col s10 left-align"> \
							<div class="chip"> \
								' + element.Category + '\
							</div>'
			if (element.SubCategory) {
				collectionItemsStr +=
					'<div class="chip"> \
										' + element.SubCategory + '\
									</div> ';
			}
			collectionItemsStr +=
				'</div> \
						<div class="col s2"> \
							<a href="#!" class="secondary-content red-text lighten-1 add-to-fav" data-id='+ element.Id + '><i class="material-icons">favorite_border</i></a> \
							<a href="#!" class="secondary-content red-text lighten-1 remove-from-fav hide" data-id='+ element.Id + '><i class="material-icons">favorite</i></a> \
						</div> \
					</div> \
				</li>';

		});
		$('.collection.fav').append(collectionItemsStr);

		favListIds.forEach(id => {
			$('.list-' + id + ' .add-to-fav').addClass('hide');
			$('.list-' + id + ' .remove-from-fav').removeClass('hide');
		});

		cardEvents();
	};

	function populateList(vCsvData) {

		let collectionItemsStr = '';

		vCsvData.forEach(element => {
			if (!element.Product) return;

			collectionItemsStr +=
				'<li class="collection-item card list-' + element.Id + '"> \
					<h6 class="card-title">' + element.Product + '</h6> \
					<p>	\
						' + element.Store + ' - \
						  ' + element.Price + ' \
					</p>	\
					<p class="flow-text"> \
						' + element.Notes + '\
					</p> \
					<div class="row" style="margin-bottom:0"> \
						<div class="col s10 left-align"> \
							<div class="chip"> \
								' + element.Category + '\
							</div>'
			if (element.SubCategory) {
				collectionItemsStr +=
					'<div class="chip"> \
										' + element.SubCategory + '\
									</div> ';
			}
			collectionItemsStr +=
				'</div> \
						<div class="col s2"> \
							<a href="#!" class="secondary-content red-text lighten-1 add-to-fav" data-id='+ element.Id + '><i class="material-icons">favorite_border</i></a> \
							<a href="#!" class="secondary-content red-text lighten-1 remove-from-fav hide" data-id='+ element.Id + '><i class="material-icons">favorite</i></a> \
						</div> \
					</div> \
				</li>';

		});
		$('.collection.all').append(collectionItemsStr);

		favListIds.forEach(id => {
			$('.list-' + id + ' .add-to-fav').addClass('hide');
			$('.list-' + id + ' .remove-from-fav').removeClass('hide');
		});

		cardEvents();
	};

	function clearList() {
		$('.collection').html('');
	}
	function clearFavList() {
		$('.collection.fav').html('');
	}

	$('.close-side-nav').click(() => {
		$('.button-collapse').sideNav('hide');
	});

	// $('.reset-filters').click(() => {
	// 	categorySelectEle.material_select('destroy');
	// 	categorySelectEle.html('<option value="" disabled selected>Choose your option</option>');
	// 	categorySelectEle.material_select();

	// 	subCategorySelectEle.material_select('destroy');
	// 	subCategorySelectEle.html('<option value="" disabled selected>Choose your option</option>');
	// 	subCategorySelectEle.material_select();

	// 	storeSelectEle.material_select('destroy');
	// 	storeSelectEle.html('<option value="" disabled selected>Choose your option</option>');
	// 	storeSelectEle.material_select();

	// 	clearList();
	// 	allData = rawData;
	// 	getALLData();
	// })

	$('.reset-filters').click(() => {
		window.location.reload();
	})
	$('.search-btn').click(() => {
		searchBoxEle.toggleClass('hide');
		searchBtnEle.toggleClass('red-text');
		$('#search-input').focus();
		if (searchBoxEle.hasClass('hide')) {
			navbarFixedEle.height(56);

		} else {
			navbarFixedEle.height(150);
		}
	});

	$('#search-check').click(() => {
		let searchText = $('#search-input').val();
		setTimeout(() => {
			console.log('search - ', searchText);
			clearList();
			populateList(allData.filter((element) => {
				return element.Product.toLowerCase().includes(searchText.toLowerCase());
			}))
		}, 0);
	});

	$('#search-clear').click(() => {
		$('#search-input').val('');
		searchBtnEle.trigger('click');
		clearList();
		populateList(allData.slice(0, 50));
		// Lazy loading the rest of the chunks
		setTimeout(() => {
			populateList(allData.slice(50, allData.length))
		}, 1000);
	});

	// Custom change ends

	$('#button').click(() => {
		console.log('click')
		let message = $('#message').val();
		console.log(message);
		$('#display').html(message);
		localStorage.setItem("message", message);
	});

	if ('serviceWorker' in navigator) {
		navigator.serviceWorker
			.register('./service-worker.js')
			.then(function () {
				console.log('Service Worker Registered');
			});
	}
})();