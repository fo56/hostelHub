import mongoose from 'mongoose';

const dishSchema = new mongoose.Schema(
  {
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
    name: { type: String, required: true, trim: true },
    mealType: { type: String, required: true },
    category: { type: String, required: true },
    priceScore: { type: Number, min: 1, max: 5 },
    healthScore: { type: Number, min: 1, max: 5 },
    itemClass: { type: String, enum: ['FIXED', 'ROTATING'], default: 'ROTATING' },
    tags: [{ type: String }],
    status: { type: String, enum: ['UNDER_REVIEW', 'ACTIVE', 'INACTIVE'], default: 'UNDER_REVIEW' },
    suggestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

dishSchema.index({ hostelId: 1, status: 1, mealType: 1 });
dishSchema.index({ hostelId: 1, name: 1 });

dishSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    const dishId = doc._id;
    const hostelId = doc.hostelId;

    // 1. Remove from StudentVote
    await mongoose.model('StudentVote').updateMany(
      { hostelId },
      { $pull: { 'votes.$[].dishes': dishId } }
    );

    // 2. Remove from MealReview
    await mongoose.model('MealReview').deleteMany({ dishId });

    // 3. Find MenuRecommendations to remove from MessMenu
    const recs = await mongoose.model('MenuRecommendation').find({ dishId }, '_id');
    const recIds = recs.map(r => r._id);

    // 4. Delete MenuRecommendations
    await mongoose.model('MenuRecommendation').deleteMany({ dishId });

    // 5. Remove from MessMenu (fixedItems & rotatingItems)
    const menus = await mongoose.model('MessMenu').find({ hostelId });
    for (const menu of menus) {
      let modified = false;
      menu.meals?.forEach((meal: any) => {
        meal.slots?.forEach((slot: any) => {
          if (slot.fixedItems && slot.fixedItems.length > 0) {
            const initialLength = slot.fixedItems.length;
            slot.fixedItems = slot.fixedItems.filter((id: any) => id.toString() !== dishId.toString());
            if (slot.fixedItems.length !== initialLength) modified = true;
          }
          if (recIds.length > 0 && slot.rotatingItems && slot.rotatingItems.length > 0) {
            const initialLength = slot.rotatingItems.length;
            slot.rotatingItems = slot.rotatingItems.filter((ri: any) => {
               return !recIds.some(rId => rId.toString() === ri.item?.toString());
            });
            if (slot.rotatingItems.length !== initialLength) modified = true;
          }
        });
      });
      if (modified) {
         menu.markModified('meals');
         await menu.save();
      }
    }

    // 6. Remove from Hostel menuConstraints
    await mongoose.model('Hostel').updateMany(
      { _id: hostelId },
      { $pull: { menuConstraints: { 'appliesTo.dishId': dishId } } }
    );
  }
});

export const Dish = mongoose.model('Dish', dishSchema);