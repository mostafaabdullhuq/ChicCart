const product = require("../models/product");

exports.prodsPagination = async (currentPage = 1, perPage = 12) => {
    let pages = [],
        leftPages,
        rightPages,
        totalProdsCount,
        pagesCount;

    // GET NUMBER OF PRODUCTS IN DATABASE
    try {
        totalProdsCount = await product.find().count();
    } catch (err) {
        totalProdsCount = 0;
    }

    if (perPage >= totalProdsCount) {
        return null;
    }

    if (totalProdsCount) {
        // CALCULATE REQUIRED PAGES FOR PAGINATION
        pagesCount = Math.ceil(totalProdsCount / perPage);

        // FOR PROTECTION FROM WRONG PAGINATION PAGE NUMBER
        if (currentPage < 1 || currentPage > pagesCount) {
            currentPage = 1;
        }

        // GENERATE ARRAY OF PAGES NUMBERS
        for (let page = 1; page <= pagesCount; page++) {
            pages.push(page);
        }
        // CALCULATE THE PAGES ARRAY
        if (pagesCount > 6) {
            rightPages = pages.slice(-3);
            if (currentPage >= pages[pages.length - 3]) {
                leftPages = pages.slice(-6, -3);
            } else {
                if (rightPages.includes(currentPage + 1)) {
                    leftPages = [currentPage - 2, currentPage - 1, currentPage];
                } else if (rightPages.includes(currentPage + 2)) {
                    leftPages = [currentPage - 1, currentPage, currentPage + 1];
                } else {
                    leftPages = [...pages.slice(currentPage - 1, currentPage + 2)];
                }
            }
            pages = [...leftPages, "...", ...rightPages];
        }

        return {
            pages: pages,
            hasNextPage: currentPage < pagesCount,
            hasPrevPage: currentPage > 1,
            pagesCount: pagesCount,
            currentPage: currentPage,
            perPage: perPage,
        };
    }

    return null;
};

exports.prodsSort = (reqSortType) => {
    let sortType;
    let sortOption;
    switch (reqSortType) {
        case "newest":
            sortOption = "Newest Arrivals";
            sortType = { createdAt: -1 };
            break;
        case "rating":
            sortOption = "Customer Reviews";
            sortType = { rating: -1 };
            break;
        case "title":
            sortOption = "Product Name";
            sortType = { title: 1 };
            break;
        case "price_h_to_l":
            sortOption = "Price: High to Low";
            sortType = { price: -1 };
            break;
        case "price_l_to_h":
            sortOption = "Price: Low to High";
            sortType = { price: 1 };
            break;
        default:
            sortOption = "Product Name";
            sortType = { title: 1 };
            break;
    }

    return {
        type: sortType,
        option: sortOption,
    };
};
