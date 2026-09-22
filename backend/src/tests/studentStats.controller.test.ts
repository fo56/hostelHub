import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { getStudentStats } from '../controllers/studentStats.controller';
import { User } from '../models/User';
import { StudentVote } from '../models/StudentVote';
import { Dish } from '../models/Dish';
import { Hostel } from '../models/Hostel';
import { MealReview } from '../models/MealReview';

vi.mock('../models/User');
vi.mock('../models/StudentVote');
vi.mock('../models/Dish');
vi.mock('../models/Hostel');
vi.mock('../models/MealReview');

describe('StudentStats Controller - getStudentStats', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      user: { _id: 'user123', hostelId: 'hostel123', role: 'STUDENT', username: 'testuser', isActive: true, name: 'Test User' } as any
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    vi.clearAllMocks();
  });

  it('should successfully aggregate and return student stats without PII', async () => {
    vi.mocked(User.countDocuments).mockResolvedValue(100);
    vi.mocked(StudentVote.countDocuments).mockResolvedValue(45);
    vi.mocked(Hostel.findById).mockResolvedValue({
      menuConstraints: [
        { sourcePhrase: 'Require Paneer on Monday', action: 'REQUIRE_PANEER' }
      ]
    } as any);

    vi.mocked(Dish.find).mockResolvedValue([
      { _id: 'dish1', name: 'Paneer Butter Masala', mealType: 'Dinner', status: 'ACTIVE', category: 'Main', itemClass: 'Veg' }
    ] as any);

    vi.mocked(StudentVote.aggregate).mockResolvedValue([
      { _id: 'dish1', totalVotes: 15 }
    ]);

    vi.mocked(MealReview.aggregate).mockResolvedValue([
      { _id: 'dish1', avgRating: 4.5, numRatings: 20 }
    ]);

    await getStudentStats(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      totalStudents: 100,
      activeVotingStudents: 45,
      constraints: expect.arrayContaining([
        expect.objectContaining({ sourcePhrase: 'Require Paneer on Monday' })
      ]),
      dishCatalog: expect.arrayContaining([
        expect.objectContaining({
          id: 'dish1',
          name: 'Paneer Butter Masala',
          totalVotes: 15,
          avgRating: '4.5',
          numRatings: 20
        })
      ])
    }));

    // Ensure NO user PII is returned in the response
    const jsonArgs = (res.json as any).mock.calls[0][0];
    expect(jsonArgs).not.toHaveProperty('users'); // Should not send users list
    expect(jsonArgs).not.toHaveProperty('usernames');
  });

  it('should return 500 if database query fails', async () => {
    vi.mocked(User.countDocuments).mockRejectedValue(new Error('DB Error'));

    await getStudentStats(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Failed to fetch student stats'
    }));
  });
});
