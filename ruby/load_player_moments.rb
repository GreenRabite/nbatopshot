require 'csv'

moments = CSV.read('./data/moments_20220114.csv', col_sep: ",")
names = []
moments.each_with_index do |moment, idx|
  next if idx.zero?
  names << moment[1]
end

p names

CSV.open("./data/results.txt",'w') do |csv|
  names.uniq.each do |name|  
    csv << [name]
  end
end