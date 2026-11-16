# CP1 – Database Normalization

## 1. Introduction

Normalization is the process of organizing data in a relational database to reduce redundancy and prevent insertion, deletion, and update anomalies.

This document explains the normalization process for the AP Capstone project, which focuses on a LinkedIn-style professional networking database.

## 2. Objectives of Normalization

The objectives of normalization are:

- To minimize redundant data.
- To maintain data consistency and integrity.
- To avoid insertion, update, and deletion anomalies.
- To organize data into well-structured relational tables.
- To establish appropriate relationships between tables.

## 3. First Normal Form (1NF)

A relation is in First Normal Form when:
- Every attribute contains a single atomic value.
- There are no repeating groups or multivalued attributes.
- Each record can be uniquely identified using a primary key.

**Application to the database:**

The database tables should store atomic values in each column. Multivalued information, such as multiple skills associated with a member, should be represented using separate related records rather than storing multiple values in a single column.

## 4. Second Normal Form (2NF)

A relation is in Second Normal Form when:
- It is already in 1NF.
- Every non-prime attribute is fully functionally dependent on the entire candidate key.
- There are no partial dependencies.

**Application to the database:**

For tables with composite primary keys, non-key attributes should depend on the complete composite key. Attributes that depend only on a part of a composite key should be moved into a separate relation.

## 5. Third Normal Form (3NF)

A relation is in Third Normal Form when:
- It is already in 2NF.
- It contains no transitive dependencies of non-key attributes on a candidate key.

**Application to the database:**

Non-key attributes should depend directly on the primary key and not on other non-key attributes. For example, company-specific details should be stored in a company relation rather than repeatedly stored in job-related records.

## 6. Functional Dependencies

Functional dependencies describe relationships between attributes in a relation.

The functional dependencies for the project should be identified from the actual database schema.

Examples of the expected format:

- `member_id → member_name, email`
- `company_id → company_name`
- `job_id → job_title, company_id`

*Note: These are illustrative examples. They must be verified against the actual schema.*

## 7. Normalization Summary

| Normal Form | Requirement | Purpose |
|---|---|---|
| 1NF | Atomic values | Removes repeating groups |
| 2NF | No partial dependencies | Removes dependency on part of a composite key |
| 3NF | No transitive dependencies | Reduces redundancy among non-key attributes |

## 8. Conclusion

Normalization helps create a structured, consistent, and maintainable database. By organizing relations according to 1NF, 2NF, and 3NF, the database can reduce redundancy and improve data integrity.

The final normalization analysis should be verified against the project's actual tables, primary keys, and functional dependencies.
