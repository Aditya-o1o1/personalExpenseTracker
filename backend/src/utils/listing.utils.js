const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getPagination = ({ page, limit }) => ({
  page,
  limit,
  skip: (page - 1) * limit,
});

const getPaginationInfo = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

module.exports = { escapeRegex, getPagination, getPaginationInfo };
