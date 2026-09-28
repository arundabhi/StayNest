import { EntityResolver } from "../src/ai/workflow/entityResolver.js";
import { BookingInterceptor } from "../src/ai/workflow/bookingInterceptor.js";
import { IntentRouter } from "../src/ai/router/intentRouter.js";

describe("Workflow Engine & Entity Resolution Unit Tests", () => {
  let resolver;
  let intentRouter;

  beforeEach(() => {
    resolver = new EntityResolver();
    intentRouter = new IntentRouter();
  });

  describe("Entity Resolution", () => {
    test("should resolve 'this hotel' to selectedHotel in state", () => {
      const state = {
        selectedHotel: {
          hotelId: "60d5ecb8bcf86cd799439011",
          hotelName: "Somnath Beach Resort",
        },
      };

      const result = resolver.resolve("book this hotel", state);
      expect(result.resolvedEntities.hotelId).toBe("60d5ecb8bcf86cd799439011");
      expect(result.resolvedEntities.hotelName).toBe("Somnath Beach Resort");
    });

    test("should resolve ordinal '2' to recently recommended hotel list", () => {
      const state = {
        recentlyRecommendedHotels: [
          { hotelId: "111", hotelName: "Hotel Grand" },
          { hotelId: "222", hotelName: "Somnath Sea Palace" },
          { hotelId: "333", hotelName: "Temple View Inn" },
        ],
      };

      const result = resolver.resolve("2", state);
      expect(result.resolvedEntities.hotelId).toBe("222");
      expect(result.resolvedEntities.hotelName).toBe("Somnath Sea Palace");
    });

    test("should detect affirmative confirmation phrases", () => {
      expect(resolver.isAffirmativeConfirmation("yes")).toBe(true);
      expect(resolver.isAffirmativeConfirmation("confirm")).toBe(true);
      expect(resolver.isAffirmativeConfirmation("proceed")).toBe(true);
      expect(resolver.isAffirmativeConfirmation("book it")).toBe(true);
      expect(resolver.isAffirmativeConfirmation("yes please")).toBe(true);
      expect(resolver.isAffirmativeConfirmation("no")).toBe(false);
    });

    test("should detect negative cancellation phrases", () => {
      expect(resolver.isNegativeCancellation("no")).toBe(true);
      expect(resolver.isNegativeCancellation("cancel")).toBe(true);
      expect(resolver.isNegativeCancellation("start over")).toBe(true);
      expect(resolver.isNegativeCancellation("yes")).toBe(false);
    });
  });

  describe("Intent Classification", () => {
    test("should classify travel planner intent for multi-day queries", () => {
      const intent = intentRouter.classifyIntent("I am visiting Somnath for 3 days");
      expect(intent).toBe("TRAVEL_PLANNER");
    });

    test("should classify hotel comparison intent", () => {
      const intent = intentRouter.classifyIntent("Compare Taj and Hyatt in Mumbai");
      expect(intent).toBe("HOTEL_COMPARISON");
    });

    test("should classify owner analytics intent", () => {
      const intent = intentRouter.classifyIntent(
        "Why are bookings decreasing this month?",
        {},
        "owner"
      );
      expect(intent).toBe("OWNER_ANALYTICS");
    });

    test("should classify support policy intent", () => {
      const intent = intentRouter.classifyIntent("What is your cancellation and refund policy?");
      expect(intent).toBe("SUPPORT_POLICY");
    });

    test("should classify booking workflow intent when awaiting confirmation", () => {
      const state = { currentStep: "AWAITING_CONFIRMATION" };
      const intent = intentRouter.classifyIntent("Yes", state);
      expect(intent).toBe("BOOKING_WORKFLOW");
    });
  });
});
