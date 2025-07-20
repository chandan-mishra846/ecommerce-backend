import Product from '../models/productModel.js';
import HandleError from '../utils/handleError.js';
import handleAsynError from '../middleware/handleAsynError.js';
import APIFunctionality from '../utils/apiFunctionality.js';

// creating products
export const createProducts = handleAsynError(async (req, res, next) => {
  req.body.user = req.user.id;
  const product = await Product.create(req.body);
  res.status(201).json({
    success: true,
    product,
  });
});

// get all products
export const getAllProducts = handleAsynError(async (req, res, next) => {
  const resultPerPage=4;
  

  const apiFeatures = new APIFunctionality(Product.find(), req.query).search().filter();


  //getting filtered query before pagination
  const filteredQuery = apiFeatures.query.clone();
  const productCount = await filteredQuery.countDocuments();
 

  //getting total page based on filtered count
  const totalPage = Math.ceil(productCount/resultPerPage)
  const page = (req.query.page)||1;

  if(page>totalPage && productCount>0){
    return next(new HandleError("This page does not exit " ,404));
  }

  //pagination
  apiFeatures.pagination(resultPerPage)
  const products = await apiFeatures.query; 

  if(!products ||products.length===0){
    return next(new HandleError("NO product found",404));
  }

  res.status(200).json({
    success: true,
    products,
    productCount,
    resultPerPage,
    totalPage,
    currentPage:page
  });
});

// update product
export const updateProduct = handleAsynError(async (req, res, next) => {
  let product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    return next(new HandleError("product not found", 404));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

// delete product
export const deleteProduct = handleAsynError(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return next(new HandleError("product not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "product deleted successfully",
  });
});

// accessing single product
export const getSingleProduct = handleAsynError(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new HandleError("product not found", 404));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

// Creatimg and Updating review

export const createReviewforProduct = handleAsynError(async (req, res, next) => {
  const { rating, comment, productId } = req.body;

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment
  };

  const product = await Product.findById(productId);

  if (!product) {
    return next(new HandleError("Product not found", 404));
  }

  const reviewExist = product.reviews.find(
    review => review.user?.toString() === req.user._id.toString()
  );

  if (reviewExist) {
    product.reviews.forEach(review => {
      if (review.user?.toString() === req.user._id.toString()) {
        review.rating = rating;
        review.comment = comment;
      }
    });
  } else {
    product.reviews.push(review);
  }

  
  product.numberOfReviews = product.reviews.length;

  let avg = 0;
  product.reviews.forEach(review => {
    avg += review.rating;
  });
  product.ratings = product.reviews.length>0?avg / product.reviews.length:0;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    product
  });
});

//Getting reviews

export const getProductReviews = handleAsynError(async (req, res, next)=>{
  const product = await Product.findById(req.query.id);
  if(!product){
    return next(new HandleError("Product not found",400))
  }
  res.status(200).json({
    success:true,
    reviews:product.reviews
  })
})


// Deleting reviews
export const DeleteReview = handleAsynError(async (req, res, next) => {
  const { productId, id: reviewId } = req.query;

  // 1. Find the product
  const product = await Product.findById(productId);
  if (!product) {
    return next(new HandleError("Product not found", 400));
  }

  // 2. Filter out the review to delete
  const updatedReviews = product.reviews.filter(
    (review) => review._id.toString() !== reviewId.toString()
  );

  // 3. Update product fields
  product.reviews = updatedReviews;
  product.numberOfReviews = updatedReviews.length;

  let avg = 0;
  updatedReviews.forEach((rev) => {
    avg += rev.rating;
  });

  product.ratings = updatedReviews.length > 0 ? avg / updatedReviews.length : 0;

  // 4. Save changes
  await product.save({ validateBeforeSave: false });

  // 5. Send response
  res.status(200).json({
    success: true,
    message: "Review deleted successfully",
    product
  });
});


//Admin - getting all products
export const getAdminProducts = handleAsynError(async(req,res,next)=>{
  const products = await Product.find();
  res.status(200).json({
    success:true,
    products
  })
})
